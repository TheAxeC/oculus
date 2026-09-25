Everything in the brief is done.

Open items of the state file: none at this brief's writing, and this step adds none.

The revert check prints 0 unproven over all 122 test files this step adds or changes. It still exits 1, because it also counts "unchecked" cases (cases with no revert directive). Nearly all of those cases were already in these files on main. The new and moved cases this step wrote all carry a revert.

## DONE / NOT DONE

| # | Deliverable | Status | Command and output |
|---|---|---|---|
| 1 | Both import cycles broken; a check that fails on any cycle and names its modules in order; each break red under its revert | DONE | `npx vitest run tests/checks/imports` gives 11 passed. `node bin/revert-check.mjs tests/checks/imports/cycles.test.ts …`: both break reverts (`local.ts:15`, `focus-lanes.ts:6`) are red, 0 unproven |
| 2 | Folder order per layer (data, server, state, ui, shell, views); zero exceptions; one test per layer, each red under its revert; a planted upward import fails the check | DONE | `order.test.ts`: 9 cases, every revert red. State imports nothing of `ui/` or `views/` (`boundaries.test.ts` rows removed; both reverts red) |
| 3 | View computations measured and moved into state, each with its own unit test | DONE | Table below. Views-to-state imports: 449 before, 471 after |
| 4 | Diagrams: `layers` overview, 6 `layer-<layer>` diagrams, writes diagram without the "reached, writes nothing" group; HELP.md, Help view and DESIGN.md show them all | DONE | `npm run diagrams` run twice: `diff -r` shows nothing (diagrams-stable). `tests/views/system/help.test.ts` passes (the manual shows every name in NAMES) |
| 5 | `locals.server.host`; `+page.server.ts` reads it there and imports nothing of the composition root | DONE | New case in `tests/routes/page.test.ts` (revert `+page.server.ts:42`, red); `tests/server/root/context.test.ts` asserts `context.host` |
| 6 | Measures before and after | DONE | Below |
| V1 | `npx vitest run --reporter=dot` | DONE | `Test Files  309 passed (309)` / `Tests  4829 passed (4829)` |
| V2 | `npm run check` | DONE | `COMPLETED 1387 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| V3 | `npm run build` | DONE | exit 0 |
| V4 | `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| V5 | `npm run lint` | DONE | exit 0 |
| V6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md` | DONE | 0 lines. The spec's perl gate also prints nothing |
| V7 | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | DONE | both exit 0 |
| V8 | `npm run diagrams` twice | DONE | no difference |
| V9 | `npm run build` then `npx playwright test` | DONE | `386 passed (6.0m)`, on the final source build. Port 8792 was free |
| V10 | `node bin/revert-check.mjs <every changed test file>` | DONE | unit: 360 reverts, 0 unproven (four batches plus rechecks); browser: 118 reverts, 0 unproven after the last recheck of `files-forms.spec.ts` and `files.spec.ts` (21 reverts, 0 unproven) |
| V11 | Measuring script | DONE | prints `module cycles 0` (below) |
| V12 | `ls -d $TMPDIR/oculus-* \| wc -l` | DONE | 7015 before, 7015 after |

## Measures (brief's script, from `tools/oculus`)

Before:
```
modules 557 edges 2069
module cycles 2 [['src/lib/data/sources/config/local.ts', 'src/lib/data/sources/config/merge.ts'], ['src/lib/state/boards/focus-lanes.ts', 'src/lib/state/boards/ticker.ts', 'src/lib/state/feeds/feeds.ts', 'src/lib/state/workbench/rail-badges.ts']]
folder rings [['server/accounts', 'server/content', 'server/core', 'server/edit', 'server/files', 'server/git', 'server/machine', 'server/sessions', 'server/watch'], ['state/boards', 'state/client', 'state/feeds', 'state/forms', 'state/life', 'state/sessions', 'state/sources', 'state/system', 'state/words', 'state/workbench', 'ui/controls', 'ui/frame', 'ui/menu', 'views'], ['shell', 'shell/panes']]
views->state 449 files 153 targets 57
```
After:
```
modules 560 edges 2094
module cycles 0 []
folder rings []
views->state 471 files 153 targets 64
```
- **Views-to-state rose from 449 to 471.** That is the expected effect of item 3: every computation that moved is now a state function the view imports.
- **Overview arrows (`docs/diagrams/layers.dot`):** views to state 471, views to ui 470, server to data 98, shell to state 68, state to data 53, routes to server 45, shell to ui 39, ui to state 8, and a few small route and entry arrows. The old diagram had 374 arrows and was 4981 x 986 pt; the overview is 566 x 337 pt.

## Folder order of each layer (top down), `tests/checks/imports/order.ts`

- **data:** `data` (index.ts, model.ts), `data/sources`, `data/snapshot`, `data/accounts`, `data/helpers`, `data/model`
- **server:** `server/root`, `server/git`, `server/edit`, `server/machine`, `server/content`, `server/files`, `server/sessions`, `server/accounts`, `server/transcripts`, `server/core`
- **state:** `state/client`, `state/workbench`, `state/feeds`, `state/life`, `state/sessions`, `state/system`, `state/boards`, `state/sources`, `state/forms`, `state/words`
- **ui:** `ui/tabs`, `ui/tree`, `ui/forms`, `ui/controls`, `ui/menu`, `ui/frame`, `ui/display`, `ui`
- **shell:** `shell`, `shell/rail`, `shell/status`, `shell/panes`, `shell/keys`
- **views:** the 8 view groups, then `views/shared`

**Exceptions: none.** Every folder is placed, and a new folder fails until it is placed.

The moves that made the order hold:
- **server:** `core/{context,socket,vite-plugin,shutdown,args,style-first,config-seed,hooks}.ts` moved to `server/root/`. `server/watch/*` moved to `server/root/watch/`, because `server/` already held ten items. `file-poll.ts`, `git/changes.ts`, `git/git.ts`, `git/git-parse.ts` and `sessions/stores/json.ts` moved to `server/core/`. `content/feeds.ts` moved to `server/edit/feeds.ts`. `projectDirectory` moved from `machine/pty/chat.ts` to `files/files.ts`. `files/project-files.ts` now reads the hub and the config through `loadLocalOrDefaults` and `portfolioConfigFrom` instead of `edit/writes.target()`, which also reads the config once instead of twice.
- **state:** `client/generation.svelte.ts` moved to `words/`. `client/instance.ts` moved to `workbench/layout/`. `words/lines.ts` and `boards/graph.ts` moved to a new `boards/structure/`. `views/registry.ts` moved to `workbench/navigation/registry.ts`. `numericSetting` moved to `data/helpers/guards.ts`. The feed identities moved from `workbench/palette.ts` to a new `state/feeds/idents.ts`. `HUB_ROOT` and `normalisePath` moved to `sources/fs.ts`. The raw-field parser moved to `forms/form-values.ts`. The tooltip counter left `ClientState`; `+page.svelte` now runs `provideTipIds(createTipIds())`.
- **ui:** `controls/Glyph.svelte` moved to `ui/display/`.
- **shell:** `workbench-title.ts` moved to `shell/panes/`.
- **data:** `configDir` moved to a new `data/sources/config/folder.ts`, which ends the local/merge cycle.

## Item 3: every view computation over a store payload (line numbers as on main)

Moved into state (views file:line, the payload it reads, where it went; every new function has its own unit test with a revert):

| View file:line | What it computes / payload | Now in state |
|---|---|---|
| structure/domains/Domains.svelte:48 `domains` | domains in the collection file's order / portfolio + collection | `boards/structure/lines.ts` `inEntryOrder` |
| Domains.svelte:59 `shown` | domains that have members / portfolio | `lines.ts` `domainsWithMembers` |
| Domains:69, Pillars:100, Venues:82, Data:77 `entryFor` | entry by id / collection | `boards/collection.ts` `entryById` |
| structure/pillars/Pillars.svelte:60 `lines` | lines in file order | `inEntryOrder` |
| Pillars:72-76 pillars / provisional / offpillar | split by kind | `lines.ts` `lineKinds` |
| Pillars:79 `tiers` | `venue_tiers` config reshaped | `lines.ts` `venueTiers` |
| pillars/ArchivalCard.svelte:21 `count` | count over the archival groups | `lines.ts` `archivedCount` |
| structure/map/Map.svelte:55 `statuses` | archived types joined to `arch_color` | `boards/structure/graph.ts` `archiveStatuses` |
| Map:97 `typeFilters`, Map:113 `lineFilters`, Map:130 `hasRelationships` | chips and counts over the graph and portfolio | `graph.ts` `typeFilters`, `lineFilters`, `hasRelationships` |
| sources/venues/Venues.svelte:64-65 | journals and conferences split | `sources/venues.ts` `venuesByCategory` |
| sources/data/Data.svelte:81 `users` | project join / portfolio | `sources/datasets.ts` `datasetUsers` |
| sources/files/Files.svelte:146 and search/Search.svelte:54 | current workspace / workspaces | `sources/fs-transport.ts` `currentWorkspace` |
| Files:165 `fixed`, :172 `editedMark`, :195 `failures`, :260 bookmark lookup, :483 `shown.every(...)` | lookups over the fs store | `fs-transport.ts` `fixedRootKeys`, `bookmarkById`, `openFailures`, `bookmarkAt`, `matchedNothing` |
| shared/links/BookmarkStar.svelte:30 | bookmark over a file | `bookmarkAt` |
| boards/person/Person.svelte:69 `documents` | the files of a listing | `fs-transport.ts` `fileEntries` |
| sources/repositories/Worktrees.svelte:58 `others` | linked worktrees / git | `sources/repositories.ts` `linkedWorktrees` |
| system/status/Status.svelte:34-35 | live count; workspace count | `sessions/folds.ts` `liveCount`; `repositories.ts` `workspaceCount` |
| system/usage/Usage.svelte:96 `orderedWindows`, :119 totals | usage payload | `system/usage.ts` `orderedWindows`, `usageTotals` |
| system/audit/Audit.svelte:68-77 `matches`, :90 sections | findings search and by kind | `system/audit.ts` `auditSearch`, `findingsOfKind` |
| system/workbench/Catalogue.svelte:79 `listed` | registry views | `navigation/catalogue.ts` `listedViews` |
| system/workbench/Pages.svelte:188 | unsaved tabs of a page | `navigation/pages.ts` `pageUnsaved` |
| system/config/files.ts `configFiles`, `lineCount` (+ `LOCAL_NAME`, `isLocalFile`, `CATALOGS`) | fs listing of `config/` | new `state/system/config-files.ts` (`lineCount` renamed `fileLineCount`) |
| system/history/rows.ts `haystack`, `matching` | change log store | `state/sessions/changes.svelte.ts` |
| sessions/session-list/SessionList.svelte:53-55, :75 `prune` | rows, counts, pruned tree | new `state/sessions/folds.ts` `sessionRows`, `hiddenCounts`, `pruneTree` |
| SessionWorkspace.svelte:42 `count` | rows per workspace | `folds.ts` `sessionCount` |
| sessions/terminal/Terminal.svelte:115, :151 | places a terminal may start | `folds.ts` `terminalPlaces` |
| sessions/agents/Agents.svelte:68, :73 | agents newest first; any running | `folds.ts` `newestFirst`, `anyRunning` |
| shared/card/CardSessions.svelte:64 | live count | `liveCount` |
| boards/focus/Focus.svelte:78 `live` | live-tier projects | `boards/focus.ts` `liveProjects` |
| focus/lanes/Lanes.svelte:142 `nextPriority`, :246 `inCluster`, :158 README check | priority levels, lanes, docs | `focus.ts` `nextPriority`, `lanesIn`; `board/items.ts` `hasReadme` |
| focus/Band.svelte:125 | funding item count | `boards/focus-lanes.ts` `stageItemCount` |
| focus/CommandCenter.svelte:123 `byKind`, :135 categories | ticker grouping | `boards/ticker.ts` `runsByKind`, `deadlinesByCategory` |
| boards/project/Project.svelte:121 `documentNames`, :142 `absent` | project docs | `board/items.ts` `markdownDocNames`, `absentDocs` |
| shared/card/ProjectCard.svelte:212 `newestDoc`, :231/:241 README | project docs | `newestDocDate`, `hasReadme` |
| shared/forms/Subtasks.svelte:51 `open` | open subtasks | `collection.ts` `openSubtaskCount` |
| shared/card/card.ts `matching` (CardDocs.svelte:51) | files store rows | `sources/files.svelte.ts` `matchingFiles` |
| shared/links/cross-links.ts `byType` (file removed) | cross-link group | `collection.ts` `membersByType` |
| feeds/leads/Leads.svelte:79 `log` | `meta.log` of the feed | `feeds/leads.ts` `runLog` |
| feeds/radar/Radar.svelte:59-64 | live / dismissed / filled buckets | `feeds/radar.ts` `dismissedSplit`, `filledBuckets` |
| academic/slides/Slides.svelte:63, :86 | slides in deck order | `life/slides.ts` `slidesInOrder` |

What stays in a view, and why:
- **Words or pixels for display:** Gallery rows, `shown` and `most` (chip labels and bar widths); Appearance `current` (a themes list built with labels); Projects `rows` and `statusMarks` (table cells with chip labels); CareerPanel `statusOf`, VenueCard contact links, CardDetails, RadarCard `sub`, RadarIntro `markStyle`, Person `organisationLine`, QuickAdd `choices` (menu labels), CardLinks `tagged`, Slides `titleOf`, focus/rows.ts `keptAction` (the row button a drawn row keeps).
- **Drawing only:** `map/labels.ts` (label boxes), `card-layout.ts` (widths), Graph.svelte `leading`, `labelled`, `measure`, `point`, `file-url.ts` and `card.ts` `urlOf` (link addresses).
- **Local interaction state:** instance-state toggles (Collection, Projects, Venues, Data, Map `toggleArchive`, Config `open`/`toggle`, Inbox `showDraft`), Memories retry bookkeeping, Editor `dirty` and per-section fields, EntryForm `kinds` and `removeMeta`, Tree `rowOf`, ShowPath, Notes `named`, Sections, Files crumbs, Pages close and drag, RailEditor remove, CardActions `pick`, CardSessions `sessionViewOpen`, Graph relation toggle (it builds the write a press sends), sessions/changes/Changes.svelte `current` (the branches come from the view's own fetch, not a store).

## Files

- **Added (27):**
  - `src/lib/state/feeds/idents.ts` 53, `src/lib/state/system/config-files.ts` 56, `src/lib/state/sessions/folds.ts` 65, `src/lib/data/sources/config/folder.ts` 17
  - `tests/checks/imports/{graph.ts 166, order.ts 126, cycles.test.ts 51, order.test.ts 100}`
  - `tests/ui/menu/tip-ids.test.ts` 17, `tests/state/feeds/idents.test.ts` 52, `tests/state/system/config-files.test.ts` 63, `tests/state/system/usage.test.ts` 34, `tests/state/sessions/folds.test.ts` 80, `tests/state/boards/board/board-docs.test.ts` 58
  - 12 `docs/diagrams/layer-*.{dot,svg}`
  - `tests/browser/helpers/.hub` is the browser suite's gitignored marker, not an authored file.
- **Moved (51, with their tests):** listed under the folder order above. The largest are `state/boards/structure/graph.ts` 786, `server/edit/feeds.ts` 514, `server/core/git.ts` 489, `server/root/watch/git.ts` 453, `server/root/context.ts` 377.
- **Removed:** `src/lib/views/shared/links/cross-links.ts`.
- **Changed (312 files):** mostly import-path rewrites. The main ones are `bin/diagrams/graphs.mjs` 420, `writes.mjs` 464, `diagrams.mjs` 171, `source.mjs` 183, `tests/checks/tree/boundaries.test.ts` 577, `tests/checks/diagrams/diagrams.test.ts` 622, `DESIGN.md` 315, `HELP.md` 240.
- **Limits:** no source file is over 900 lines and no folder holds more than ten items (both checks exit 0).

## Judgment calls (the orchestrator may reverse any of them)

1. **Order and cycle checks are in a new folder, `tests/checks/imports/`.** `tests/checks/tree/` is at ten items. `boundaries.test.ts` now imports `sourceFiles` and `target` from `imports/graph.ts`, so all three checks read modules the same way.
2. **New folder names:** `server/root/` (the composition root and its watchers, `root/watch/`), `state/boards/structure/`, `tests/server/root/`.
3. **`server/core` became the bottom folder** and received `git.ts` and `git-parse.ts`. `files/fs.ts` needs `ignoredIn`, and `git/deposit.ts` needs `edit/writes`, so leaving `git.ts` in `server/git` would have closed a loop.
4. **The checks and the diagrams count runtime imports only,** as the brief's graph does.
5. **A component that imports itself is not counted as a cycle.** `SplitView.svelte` and `PageLeaf.svelte` do this to draw themselves recursively.
6. **The writes diagram still draws a module a refusal calls,** even though it writes nothing, so the `hasToken` refusal into `core/auth.ts` stays visible. Every other module that writes nothing is dropped, with its edges.
7. **Diagram counts:** an arrow's number counts distinct module pairs, as the brief's script does. A glob counts as one import.
8. **Tests renamed or regrouped when they moved:**
   - `tests/views/whole/registry.test.ts` became a state test; its 27 view-audit allow entries were removed.
   - Cases moved from `tests/views/system/config.test.ts`, `history.test.ts`, `shared/links/crosslinks.test.ts` and `shared/card/card.test.ts` into state tests; their `allow-audits.txt` entries were removed.
   - One card case was renamed to "audits that a path splits into its visible parts".
9. **`fileLineCount` rename:** the config view's line counter was renamed so it does not collide with `editor-text.ts`'s `lineCount`, which counts differently.
10. **Allow-list bookkeeping:**
    - `allow-duplication.txt`: the existing Domains/Pillars pair entry was updated to its new hash and lines (`faabb7977ab6 … at 61 and 79`), and the context-fixture pair entry now names the moved paths.
    - No entry was added for a new pair.
11. **`plantScratch` was added to `tests/fixtures/scratch.ts`,** so the new checks and `tests/data/sources/feeds.test.ts` share one planting helper instead of copying it.

## Changes a host or user can see (before / after)

- **Help view, section "How the code fits together":**
  - Before: 3 diagrams, and the layers diagram was 4981 pt wide.
  - After: the layers overview (566 x 337 pt, one box per layer with counts), then the data, server, state, ui, shell and views diagrams, then channels and writes.
  - To look: open Help on TEST in both themes. `[data-diagram]` count goes from 3 to 9.
- **Writes diagram:** before, it had a dashed "reached, writes nothing" group; after, that group is gone and only the auth refusal target stays.
- **The app itself is unchanged:** 386 browser cases pass. The only browser spec edits are a case title ("draws every diagram") and revert line numbers.

## What in the brief was wrong or impossible, with the evidence

- **Fact 1's premise that nothing outside the listed paths needed editing did not hold.**
  - `vite.config.ts` imports `server/core/vite-plugin.ts` and `style-first.ts`. Moving them required editing its two import lines and its head comment.
  - `bin/cited-lines.mjs:13` still gives `src/lib/server/git/git.ts:350` as an example citation. It is outside this step's paths and was left as is.
- **Some revert directives were already stale on main.** Their target files had shifted in earlier steps, so they would not run as written. They were repointed so the changed files reach 0 unproven:
  - `tests/state/sources/fs.test.ts`: 8 directives into `fs.svelte.ts`.
  - `tests/browser/sources/files-forms.spec.ts` (3) and `files.spec.ts` (1).
  - `tests/browser/shell/settings.spec.ts` (`+page.svelte`, now line 122).
  - Evidence: `cmp` shows `fs.svelte.ts` is identical to main, and the directive text is identical to main.

## Limitations

- **56 type-only imports still climb the folder order.** The order check does not see them because it counts runtime imports only.
  - Most are store types declared in `state/client/*.svelte.ts` that lower stores take as injected parameters.
  - 18 are `data/model.ts` imported from `data/sources` and other data folders.
  - The others: `core/changes.ts` to `files/fs.ts` (`FsWrites`), and `accounts/*/routes.ts` to `files/open.ts`.
  - The count came from a Python walk over `import type` statements. Holding type imports to the order too would mean moving those types down: a larger change, for the orchestrator to decide.
- **Unchecked cases:** the revert check counts cases in the changed files that name no revert. Nearly all were already in these files on main; the new and moved cases all name one.
- **Diagram readability:** the SVGs were not viewed rendered here; only their sizes were measured (for example `layer-state.svg` is 577 x 680 pt, `writes.svg` 1225 x 519 pt).
