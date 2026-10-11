# D66 report, three view fixes

Everything in the brief is done, with one premise of the brief that does not reproduce (case 5's command names the wrong file key; the corrected command is quoted below) and one test file whose two red lines are in code this step does not touch (below, in the DONE table).

## Premise of the brief that does not reproduce

Case 5 as written, `shapeIssues('catalogs/vocab', { arch_color: ... })`, returns `[]` on the unchanged tree and also after the change, because `fileShapeOf` (`src/lib/data/shapes/catalog-files.ts:394-399`) finds a catalog by `one.file === norm` and the file is `catalogs/vocab.yml`; the name `catalogs/vocab` finds no shape and `shapeIssues` returns `[]` at `shape-issues.ts:30` before it reads any key. Both trees, same script, both names (base run on a copy of the base's `src/lib/data` in the scratchpad):

```
BASE catalogs/vocab []
BASE catalogs/vocab.yml []
NOW catalogs/vocab []
NOW catalogs/vocab.yml [{"kind":"unknown","key":"arch_color"}]
```

The case's expectation holds with the file name `catalogs/vocab.yml`: `[]` on the unchanged tree, one issue naming `arch_color` after the change. The step does not depend on the wrong name.

## Open items of the state file, verbatim

`orchestrator-state.md`, "Open items": `None.`

## The cases' first run, on the unchanged tree

Cases 1 to 4, 7, 9 and 10 are readings (the brief says so); each quote below is the code as it was at the base, read in the worktree before any change.

1. `nodeTone`, `node-view.ts:25-28`: `if (node.archived === undefined) return typeTone(node.type ?? ''); const color = readAs(colorShape, readAs(mapShape, archColors)?.[node.archived]); return color === null ? 'grey' : toneOf(color);`. `archived(project)` (`graph.ts:79-81`) is `project.type` for tier `archive` or `coauthor`. `arch_color` (`vocab.yml:225-234`) holds published, submitted, in-prep, tech-report, software, abandoned, nogo, dropped, disproved. So on the unchanged tree: `published` and `nogo` give their `arch_color` hexes' tones (the same hexes `type_color` holds), and `paused`, `finished`, `archived`, `phd`, `idea`, `active` give `grey` because `arch_color` names none of them. The brief's list of unchanged greys omits `paused`; it is grey there too (`paused` has no `arch_color` entry), and it is grey after the change as well, since `type_color` gives `paused` `#9ca3af`, which `palette` maps to `c-grey` (`vocab.yml:46`). The board card's call is `tone: typeTone(project.type ?? '')` (`board/items.ts:107`). The rule the brief gives holds for all eight types.
2. A node of the tier `projects`, type `active`: `node.archived` is undefined, so `typeTone('active')` before and after.
3. `archiveStatuses`, `graph.ts:315-330` at the base: returns `{ status, ...(color === undefined ? {} : { color }) }`; `published` has a colour, `phd` has none, and `Controls.svelte:118` drew its dot `var(--c-grey)`. The brief's expected result holds after the change.
4. `manuscript` names no `type_color` entry: `typeTone` returns `UNKNOWN_TONE` (`tones.ts:139-143`, `grey`), the board card's call as case 1 quotes. At the base the Map gave `grey` through the missing `arch_color` entry; the same tone.
5. See "Premise of the brief that does not reproduce": unchanged tree, `catalogs/vocab.yml`: `[]`.
6. Unchanged tree, `grep -rn --exclude=local.yml "arch_color\|archColors\|archiveStatuses\|nodeTone" src tests config`, run before any change: hits in `catalog-files.ts:93`, `graph.ts:313,315`, `Graph.svelte:35,381`, `Map.svelte:33,67`, `node-view.ts:9,23,25,27`, `config-folder.test.ts:231`, `vocab.yml:54,225`.
7. `Usage.svelte:330-338` at the base: `.live-row { ... font-size: var(--fs-md); }`; `.live h3, .history h2` (`:319-326`) `--fs-xs`; `.session` (`:340-344`) `--fs-sm`; `.refresher` (`:309-313`) `--fs-sm`.
8. Implied inputs are read from the code after the change (see the cases section below).
9. `Tabs.svelte:169-173` at the base: `$effect(() => { const selected = active; const index = tabs.findIndex((tab) => tab.id === selected); queueMicrotask(() => scrolling.reveal(index)); });`, reading `active` and `tabs`. The diagnosis record's run without the fix: `A 116 | A 116 | A 116`, `B up on svg scroll 143 selected Workbenches`.
10. Read after the change (below).

## DONE / NOT DONE

| Row | Command | Output |
|---|---|---|
| 1 `arch_color` removed from `vocab.yml` (blank line, key, nine entries, two blank lines kept before `# Dataset access`) | `sed -n 215,232p config/catalogs/vocab.yml` | `- [submit-ready, numbers-pending]`, blank, blank, `# Dataset access -> chip colour.` |
| 1 `vocab.yml:52` comment | `sed -n 52p config/catalogs/vocab.yml` | `# Project-type colours, keyed by the manifest's `type`: the colour of a project's type wherever it is drawn (its board card, the Map, the Present view's project chip).` |
| 1 `vocabFileShape` loses `arch_color`; case 5 | `npx tsx -e` with `shapeIssues('catalogs/vocab.yml', { arch_color: { published: '#16a34a' } })` | `[{"kind":"unknown","key":"arch_color"}]` |
| 1 `nodeTone(node)`, `colorShape`, `mapShape`, `toneOf`, `z` gone | `node-view.ts` is 23 lines; `nodeTone` is `return typeTone(node.type ?? '')` (`:21-23`) | `wc -l` 23 |
| 1 `archiveStatuses(snapshot)` returns `{ status, tone: typeTone(status) }[]` | `graph.ts:310-318` | read |
| 1 `Controls.svelte` `Status = { status: string; tone: string }` and the dot `var(--c-${item.tone})` | `grep -n "item.tone" Controls.svelte` | `116: ... style={`--archive-tone: var(--c-${item.tone})`}` |
| 1 `Map.svelte:67`, `Graph.svelte` call the new signatures | `grep -n "archiveStatuses(snapshot)" Map.svelte` | `67:    const statuses = $derived(archiveStatuses(snapshot));`; `Nodes.svelte:65` `nodeTone(node)` |
| 1 `config-folder.test.ts` owned keys lose `'arch_color'` | `diff` of the file against the base copy | `231d230 <             'arch_color',` |
| 1 unused imports and helpers removed | `npm run test:quick` (eslint, svelte-check) | `ok      eslint (9.9 s)`, `ok      svelte-check (10.3 s): ... 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 1 `Graph.svelte` split under 520 | `wc -l src/lib/views/structure/map/*.svelte` | `466 Graph.svelte`, `107 Nodes.svelte`, `191 Map.svelte`, `162 Controls.svelte`, `33 Legend.svelte` |
| 2 `.live-row` at `--fs-sm`, `.session` without its own size | `sed -n 330,343p Usage.svelte` | `.live-row {... font-size: var(--fs-sm); }`; `.session { color: ...; font-family: var(--font-num); }` |
| 3 reveal effect on the showing tab's id, `tabs` untracked, with its comment | `sed -n 168,183p Tabs.svelte` | `let revealedFor ...` at `:175`; `if (selected === revealedFor) return;` `:178`; `untrack(() => tabs.findIndex(...))` `:180` |
| Case 6 | `grep -rn --exclude=local.yml "arch_color\|archColors" src tests config utils docs; echo "case6 rc=$?"` | prints nothing, `case6 rc=1` |
| `npm run test:quick`, one full-list run after the last change | `npm run test:quick` | `test:quick: 16.5 s (limit 45.0 s); every command passed` (prettier, ASCII gate, svelte-kit sync, eslint, vitest, svelte-check all `ok`) |
| Unused exports | `sh utils/unused-exports.sh > ue.txt; diff <base>/unused-exports.txt ue.txt` | no output, `diff rc=0`; the step adds no line (the two `graph.ts` lines are the base's) |
| Sizes | `wc -l` of every changed file | see "Files" |
| Folder count | `ls src/lib/views/structure/map \| wc -l`; `sh utils/folder-check.sh` | `9`; folder-check prints nothing |
| Size check | `sh utils/size-check.sh` | prints nothing |
| ASCII gate | the `perl` gate of `spec.md` over `src tests bin config` | prints nothing (`find` names `bin` as absent in this tree; the gate covers the other three) |
| `config-folder.test.ts` alone | `npx vitest run tests/checks/config/config-folder.test.ts` | `Tests  2 failed \| 23 passed (25)`; the two red lines are `reads the roots of sources.yml without a finding` (`ROOTS.length` is 0 at `:574`) and `names a group of its own and a path under the hub for every document` (`:579`); both sit in the block that reads the real hub (`:557-603`), which this step does not touch (the file's only change is the one removed line at `:231`). Not run on the base, so that the two fail there too is not verified. The owned-keys case of the file is among the 23 passing |

`npm run diagrams` ran before the list. It rewrote the files of `docs/diagrams/`; whether any content changed is not verified (no git command is mine to run). `docs/diagrams/` is outside the write list; the diagrams are layer graphs, `Nodes.svelte` adds only an import from `views/structure/map` to the same state and `node-view` modules `Graph.svelte` imported, and `grep -l "Nodes\|structure/map" docs/diagrams/*` lists only `channels.dot` and `channels.svg`.

### Cases 1 to 4, 7 to 10 after the change (readings, with the lines)

1. `nodeTone(node)` (`node-view.ts:21-23`) is `typeTone(node.type ?? '')` for every project node; `Nodes.svelte:65` draws `--node-fill: var(--c-${nodeTone(node)})`. `published`, `nogo`, `paused`, `finished`, `archived`, `phd`, `idea`, `active` each give the tone the card's `typeTone(project.type ?? '')` (`board/items.ts:107`) gives: `paused` and `dropped` are `#9ca3af` in `type_color` (`vocab.yml:53`) and `c-grey` in `palette` (`vocab.yml:46`); `phd` is `#6366f1`, `c-indigo` (`vocab.yml:38`). The values were not computed by a run (`tones.ts` reads a rune, `npx tsx` cannot import it).
2. Tier `projects`, type `active`: `node.archived` does not enter `nodeTone`; `typeTone('active')`, the same tone as at the base.
3. `archiveStatuses(snapshot)` (`graph.ts:310-318`): the loop adds the type of each project of tier `archive` or `coauthor` to a `Set`, in snapshot order; the result is `[{ status: 'published', tone: typeTone('published') }, { status: 'phd', tone: typeTone('phd') }]` for the brief's snapshot. `Controls.svelte` draws `var(--c-${item.tone})`.
4. `manuscript`: `typeTone('manuscript')` is `UNKNOWN_TONE` (`tones.ts:139-143`), the card's tone.
7. `.live-row` `font-size: var(--fs-sm)` (`Usage.svelte:339`), `.session` has no size and takes the row's, `.refresher` is `--fs-sm` (`:312`), `.live h3` is `--fs-xs` (`:322`). 12 px against the heading's 11 px at 100 percent.
8. Implied inputs. `dropped`: `type_color` `#9ca3af`, `grey`, as its card. `Published`: `typeTone` lower-cases (`tones.ts:141`), so green on the node and the dot; `archiveStatuses` keeps `status` as written, so the checkbox label keeps the case. An archive project with no `type`: `archived(project)` is undefined (`graph.ts:79-81`), so the project is always visible, gets no status, no `archived` class, and `nodeTone` gives `typeTone('')`, the unknown tone (`grey`). An archived node keeps `.node.archived { opacity: 0.6 }`, which moved with the markup to `Nodes.svelte` (`style` block), so it shows its card's hue at 60 percent.
9. `Tabs.svelte:176-182`: the effect reads `active` (`:177`) and `revealedFor` (non-reactive `let`, `:175`); `tabs` is read inside `untrack` (`:180`). A layout write that leaves the same tab showing re-runs nothing that reaches `scrolling.reveal`. The press on the scroll-left control calls `step(-1)` of `tab-scroll.svelte.ts` (not changed) and nothing reveals after it; the diagnosis's runs with the same change were `A 116 | A 0 | A 0 | B up on SPAN scroll 116 selected Usage`. Not run by me (a builder runs no page); the landing look repeats the record's original case.
10. First draw: `revealedFor` starts `undefined` (`:175`), so the first run passes the guard (`:178`) and reveals. A selection that changes the showing tab changes `active`, so `:178` passes and `:181` reveals. A tab closed so another shows: the caller's `active` changes, same path. A pane that gets wider or narrower: `resized()` (`tab-scroll.svelte.ts:132-139`, observed by the `ResizeObserver` at `Tabs.svelte:160`) reveals the showing tab when it was whole and no longer is, unchanged. A tab added or moved with the same tab showing: `active` is equal, `:178` returns, the strip does not scroll; the faces change, the `ResizeObserver` effect (`:155-166`) re-runs because `faces`/`tabs.length` change, observes the new faces, and `resized()` reveals the showing tab when the change pushed it out of sight. `press` (`:217-219`) and the arrow keys (`:241`) keep their own reveals.

## Files

`diff -rq` of the base copy against the worktree over `src tests utils config assets` lists exactly these paths, all in the write list:

| Path | Lines | Change |
|---|---|---|
| `config/catalogs/vocab.yml` | 250 | `arch_color` removed; comment at line 52 |
| `src/lib/data/shapes/catalog-files.ts` | 399 | `arch_color` out of `vocabFileShape` |
| `src/lib/state/boards/structure/graph.ts` | 463 | `archiveStatuses(snapshot)` returns tones; unused shape imports removed; imports `typeTone` |
| `src/lib/views/structure/map/node-view.ts` | 23 | `nodeTone(node)` |
| `src/lib/views/structure/map/Map.svelte` | 191 | new call |
| `src/lib/views/structure/map/Controls.svelte` | 162 | `Status` type, dot from `item.tone`, `toneOf` import gone |
| `src/lib/views/structure/map/Graph.svelte` | 466 | node layer moved out; `configMap` and `nodeTone` imports gone; head comment names `Nodes.svelte` |
| `src/lib/views/structure/map/Nodes.svelte` | 107 | new file, the node layer (path inside the write list's "one new file") |
| `src/lib/views/system/machine/usage/Usage.svelte` | 364 | `.live-row` and `.session` |
| `src/lib/ui/tabs/Tabs.svelte` | 502 | reveal effect and its comment, `untrack` import |
| `tests/checks/config/config-folder.test.ts` | 640 | `'arch_color'` removed from the owned keys |

Edits to an existing assertion, allow list or predicate: one row. `config-folder.test.ts:231`, the owned keys of `catalogs/vocab.yml`: before `'arch_color',` in the list, after the line removed (the key is no longer in `vocabFileShape`). No test is added; the step changes no test's behaviour, so there is no failing line to quote on the unchanged tree.

`tab-scroll.svelte.ts` and `tab-strip.ts` are not changed.

## Judgment calls the brief left open (each reversible)

1. The split of `Graph.svelte` takes the node layer into `Nodes.svelte` (a stateless layer: circles for projects, squares for pillars and collaborators, their keyboard stops and their scoped styles). The press goes back to `Graph.svelte`'s `nodeDown` through `onpress`, the node under the pointer and the node holding the keyboard come back through two `$bindable` props (`hovered`, `focused`), because `Graph.svelte` draws that node's label on top. The labels layer stays in `Graph.svelte` because its measuring, its effects and its element refs are bound to the SVG. The new file's `<svelte:options namespace="svg" />` makes the compiler emit `$.from_svg` templates (`svelte/compiler` output of the file: `var root = $.from_svg(...)`); without it a component whose root element is a `<g>` would be created in the HTML namespace. The folder holds 9 items after the change.
2. `hovered` and `focused` are declared optional in `Nodes.svelte`'s `Props` (`hovered?: string | null`), since the rule `@typescript-eslint/no-useless-default-assignment` refuses `$bindable()` on a non-optional property; `Graph.svelte` always binds both.
3. `graph.ts` now imports `typeTone` from `shared/words/tones.ts`, a module that reads the configuration's generation (a rune module). The module is already imported by `state/boards/board/items.ts`, a sibling state module, so the layer boundary holds (`svelte-check` and the boundaries check in `test:quick` pass; `tests/checks/tree/boundaries.test.ts` itself is in the landing list, not run by me).
4. The comment above the reveal effect (`Tabs.svelte:168-174`) says what it reveals, why it does not track `tabs`, and that a changed width is `resized()`'s.

## Host- or user-visible changes, before and after

| Where | State to put it in | Before | After |
|---|---|---|---|
| Map, node of an archive or coauthor project | a project of type `finished`, `archived`, `phd`, `idea`, `active` or `paused` in tier `archive` or `coauthor`, its status enabled in the bar | grey (no `arch_color` entry) | its type's colour, as its board card: finished and archived green, phd indigo, idea violet, active orange; `paused` stays grey; the node keeps 60 percent opacity |
| Map, node of an archive project of type `published`, `nogo`, `dropped`, ... | the same | the `arch_color` entry (the same hex `type_color` holds for each of the nine) | the same tone |
| Map bar, archived-status dot | a coauthor project of type `phd` | grey dot | indigo dot, from `item.tone` |
| Map, node of a project in tier `projects` | any | its type's tone | the same |
| Usage card, "Live sessions" rows | an account with a live session | model, context, cost, folder at 13 px (`--fs-md`), larger than the card's other secondary words | 12 px (`--fs-sm`), the session id's and the refresher line's size; heading stays 11 px uppercase |
| A float's tab strip, `[hpc, usage, workbenches]` docked right at 0.2, Workbenches showing, scrolled 143 of 143 px | press "Scroll tabs left" three times | the strip stops at 116 and stays there | per the record's run with the same change: 116, then 0, then 0 |
| The same strip, Usage half hidden at the right edge | press Usage 8 px inside its right edge | the strip moves between pointerdown and pointerup, Workbenches stays selected | Usage is selected |

## Anything in the brief or the design that turned out wrong or impossible

1. Case 5's command (above).
2. The brief's unchanged-tree grey list for case 1 omits `paused`; it is grey there as well (stated under case 1).
3. The brief puts `Controls.svelte:118` as the dot's line; it is `Controls.svelte:116` after the formatter wrapped the element (no difference in meaning).

## Greps and re-reads

- Name grep after the change, `grep -n --exclude=local.yml -r "arch_color\|archiveStatuses\|nodeTone\|archColors\|colorShape" src tests config docs HELP.md DESIGN.md README.md utils`: hits only the new signatures (`graph.ts:310`, `Map.svelte:33,67`, `node-view.ts:21`, `Nodes.svelte:11,65`) and `colorShape` of `tones.ts:42,82,84` (a separate constant of that module). `HELP.md:237` (the Map bullet) names filters, no colour; `HELP.md`, `DESIGN.md`, `README.md`, `docs/` hold no sentence about the Map's colours, the live-session row size or the tab strip's reveal (`grep -n -i "reveal"` over them: no tab-strip hit). Nothing is rewritten in them.
- Head and doc comments re-read: `Graph.svelte` head, rewritten (the node layer sentence, rewrapped as a whole paragraph at 100 columns); `Nodes.svelte` head, new; `node-view.ts` head and `viewOf`, still true; `nodeTone` doc, rewritten; `graph.ts` head, still true; `archiveStatuses` doc, rewritten; `Controls.svelte` head, still true; `Map.svelte` head, still true; `catalog-files.ts` `vocabFileShape` doc, still true; `vocab.yml` comment at line 52, rewritten; `Usage.svelte` head and the comment above `.live-row`, still true; `Tabs.svelte` head (reveal on "a tab becoming the shown one, being pressed, or being crossed or hidden by a change of width"), still true; the doc of `press`, still true; the doc of `keys`, still true; the effect's comment, new; `tab-scroll.svelte.ts` head, still true.
- History words in the comments and the `vocab.yml` comment I wrote or rewrote: `grep -n -i "before\|used to\|no longer\|still\|always\|as before\|previously\|the step adds\|after this"` over `Nodes.svelte`, `node-view.ts`, the `archiveStatuses` doc, the effect comment and `vocab.yml:52`: no hit.
- Reuse check: `find src tests -name 'Nodes*'` lists only `src/lib/views/structure/map/Nodes.svelte`; the step adds no helper, type or schema beyond that component and its `Props`.

## Limitations and sharp edges

1. The two red lines of `config-folder.test.ts` above are in the real-hub block; their cause on this machine is not investigated, by the spec's rule for failures outside the step.
2. Part 3's fix and the Map and Usage looks need a page; none was run by me. The landing look repeats the diagnosis's original case for the strip, opens the Map with a coauthor `phd` project and an archive `finished` project (dot and node), and shows the Usage card with a live session.
3. `hovered`/`focused` bound through the new component: the label-on-top behaviour of a hovered or keyboard-held node is read, not seen, in this report.
