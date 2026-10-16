Everything in the brief is done. What stays with the orchestrator is what the brief gives it: the looks of item 43 (listed at the end) and case 22. Read first: four G61 rows the start patch wrote and the G35 recover row are not yet in `agents/guarded.md`, which only the orchestrator writes ("Guarded rows" below), and item 32 keeps an explicit `CACHE_VERSION` ("Judgment calls").

# O37 report

## Open items of the state file (orchestrator-state.md:159-163, verbatim)

- none.

## The cases' first run

"Base" is the base copy `O37-base` (a run is made in its scratch copy `c17b`); "patched" is the worktree as the start patch left it, before any change of mine; the state after is in the DONE table. A reading names the file and line it read.

1. Base, `t()` over the catalogue: merge_left 1 "1 conflicts left"; merge_complete_confirm 1 "1 conflicts are still open..."; folder_discard_confirm 1 "...1 paths in 1?"; list_changes 1 "1 changes"; merging, rebasing and cherry_picking 1 "1 files are in conflict." (their `_one` keys existed and nothing read them); sync_detail 1 "git pulls 1 commits and then pushes 1."; no `_one` key for merge_left, merge_complete_confirm, folder_discard_confirm, list_changes or sync_detail. Patched: merge_left_one "1 conflict left", merge_complete_confirm_one "1 conflict is still open. Complete the merge anyway?", every other count as on base.
2. Base (reading): parse.ts statusCollector passes git's letter through, so `T` reaches the staged and unstaged lists; repositories.ts STATUS_WORDS and STATUS_TONES hold no `T`, so the row reads "changed" with no tone; reads.ts sidesOf gives a type change as a deleted and a created side of one path, two sections titled alike; diffActions gives `whole` to each half, so HunkBar offers Stage Block and Revert Block, a patch git refuses. Patched: one joined file, "type changed" in the modified tone, diffActions `none`, a note naming the two sides (wrong in the inline mode), no G33 row. The G33 row on base (c17b): "Tests 15 passed (15)": stage and discard already act on the whole path, and the row guards it.
3. Base (reading): the bar is a nowrap flex row of ToolButtons in Tooltip wrappers with min-width 0, which overlap at 110 px. Patched: it wraps, still 26 px text buttons, not code lens links.
4. Base, `node -e` glyphItems('', 'No icon', ['theme_rice','open_program','biennial','replace_all']): labels "theme_rice", "open_program", "biennial", "replace_all". Patched: "Theme rice", "Open program", "Biennial", "Replace all"; GlyphDialog a QuickPick with glyph and description; `.row .tool.plain` gap 6px under every theme.
5. Base (reading): placementKey holds edges and radii, so a link write lays the map out anew; Map's `{#key layoutKey-seed}` remounts on a change of the node set; a resize scales a fixed 1000x680 `meet` box. Patched: a link keeps the nodes; a node added or removed still remounts and lays out anew; a resize stretches each axis, so places change.
6. Base: labels checked against labels and nodes only, always right of the node (cut at the right edge); `node -e` of notes/place-time.js: "nodes 79 edges 80 on a wall 9", "ms 80.4 62.7 52.3 51.1 53.5 52.7 52.1 52.3 52.6 51.9". Patched: "on a wall 0", "ms 179.2 141.0 138.5 134.3 131.3 130.1 130.6 130.9 138.5 131.1".
7. Base (reading): viewBox 1000x680 under `meet`, so a tall or wide pane shows bands. Patched: the viewBox is the measured pane size.
8. Base: each of the twenty names prints its own file only, with an `export` line (holdTerminals tests/fixtures/client.ts:25, ..., Planted tests/routes/apps/apps-fixture.ts:37 `export type`). Patched: 14 print nothing; useClock, Copies, PersonalTarget, REPOSITORY_MANIFEST, RepositoryTarget and Planted print lines of their own file and no export of the name.
9. Base (reading): Toolbar.svelte:89 `if (panel === undefined) return;` then `panel.children`; `bind:this` sets null on close, so the effect throws. Patched: the guard changed to null, a guard and not the item's fix.
10. Base (reading): TerminalList.svelte:394 a fixed 180px width, no narrowing. Patched: list/list-width.svelte.ts (46 to 500 px, GRID_ROOM 240, hidden below), a dragged width kept; with the list hidden the bar names the shown terminal and nothing reaches the others; TerminalList.svelte 522 lines (over 520).
11. Base (reading): TreeActions at opacity 0 keeps its flex room. Patched: `display: var(--actions-display, none)`, shown on hover, focus-within and an open menu; not on a selected row.
12. Base (reading): builds.ts onSaved returns while the settings are null, so no build ever comes. Patched: saves.ts holds one save per file and runs them on the config message; two files of one root still build twice.
13. Base (reading): Modal's scrim is `var(--bg)` at opacity .72; ScheduleDialog's class is `dialog`; viewer.svelte.ts:51 imports pdf_viewer.css globally, with `.dialog` rules and `:root` variables. Patched: a `--scrim` token rgba(0,0,0,0.5), ScheduleDialog's class `box`; pdf.js's stylesheet still global.
14. Base (reading): Editor.svelte:213-215 and 443-448 repaint only when the JSON of [look, codeTheme] differs from `painted`; a failed paint sets `painted` null, but a second pick of the same theme changes neither value, so nothing repaints. Patched: ui.svelte.ts counts code theme picks, `editorLook()` carries theme, text scale and picks, every editor host passes it; kit/load.ts:474 asks a failed theme again at the next paint.
15. Base (reading): the selection is memory-only and the views follow it, so after a reload none shows. Patched: keepShown writes `{ shown }` into the instance state; followedSession takes the pin, then the selection, then the shown one; SessionPicker (Session, Transcript, Timeline) and Files use it.
16. Base (reading): the page closes a Terminal tab when a sessions message stops naming its terminal (terminals.svelte.ts afterReceive, terminal-lists.ts closeEnded); a page's save writes its own envelope over a newer one another page wrote (saved/storage.ts). The G29 row on base (c17b): "AssertionError: expected '{"version":7,"pages":[...' to contain 'From the first'" at layout-workspaces.test.ts:224:23, "Tests 1 failed | 11 passed (12)". Patch: no change.
17. Base (c17b; test tests/views/sources/repositories/view-menu.test.ts; reference types from a lone `svelte-kit sync`): five rounds of two `npx vitest run` at once with .svelte-kit removed, "types same" each round (the race did not show); five rounds of vitest with `svelte-kit sync` at once, "types same"; a fresh sync killed (-9) at 1.55 s left 31 files and no non-ambient.d.ts, which the next vitest wrote again; a sync over whole types killed at 1.55 s left "Only in c17ref/.svelte-kit/types: route_meta_data.json", the next run "Test Files 1 passed (1)" and the types still not whole (syncTypesOnce skips while non-ambient.d.ts exists). Patched (c17w): the same rounds "types same"; a killed re-sync left its lock, the next run "took over .../oculus-types.lock, which was 60032.25 ms old", "run took 62 s", and the types still not whole.
18. Base (`node -e` notes/c18.js, files in c18/): "late-exif.png {"width":40,"height":20}", "late-exif.jpg null", "many-no-exif.png {"width":40,"height":20} ms 5.6 0.6 0.5 0.6 0.6", "zero-seg.jpg null", "overrun-seg.jpg null". Patched: late-exif.png and late-exif.jpg {"width":20,"height":40}; many-no-exif.png "ms 32.1 33.1 29.9 27.9 25.7" (3014494 bytes, 200000 chunks); zero-seg.jpg and overrun-seg.jpg null.
19. Base `t('files.read_again')` "read again"; patched "Read again".
20. Base (reading): WorkspacePicker short() is `t('composer.hub')` for the primary, else the last segment, so a/x and b/x both read "x"; TerminalList's focusout disarms Kill when the focus moves to the grid; the composer keeps split and worktree after a start lands. Patched: colliding names lengthened, but a hub still reads the generic word "hub" and two hubs of one name are not told apart; kill-arm.svelte.ts drops the focusout disarm; splitEnded after a landed start.
21. Base: docs/diagrams/writes.svg width="4225pt" height="1927pt"; FONT 'Helvetica,Arial,sans-serif', which Graphviz measured as Times. Patched: FONT 'Helvetica' measured, the SVG's font-family written as the list, writes cut into parts stacked in rows.
22. The orchestrator's case at landing (brief, case 22).
23. Base (reading): Editor.svelte's drawHighlights effect reads only the highlights and the collections, so tints set before the model exists are lost. Patched: it reads the model.
24. Base (c17b, load about 8): git-ops 17 passed 29.12s (tagged slow); config-key 8 passed 10.54s (tagged slow); detached 1 passed 2.21s (tagged slow); routes config-value 1 passed 4.02s (tagged slow); server config-value 5 passed 4.58s; keys 8 passed 49.20s (transform 18.06s, import 44.33s, tests 4.75s); git-scan-depth 12 passed 2.08s; comment-width "Test timed out in 5000ms" 19.09s, again at 7262 ms. Patched (same load): git-ops 42.90s; config-key 16.44s; detached 5.98s; routes config-value 8.51s; server config-value 8.04s; keys 2 failed (UpdateTray's computed key; app.tasks.last and app.tasks.last_post orphaned) 46.87s; git-scan-depth 2.52s; comment-width 1 failed 9.52s.
25. Base (reading): RailEditor.svelte:125 `{#if rows.length === 0}` draws "The rail has no button." while the configuration is unread, since the rows are empty then. Patch: no change.
26. Base (reading): away.ts:67 and :93-95 move a view already open in the catalogue's pane to the end of the other pane's strip when the catalogue opens it (`openAway`, `openNextTo`), which is how a Files tab leaves place 0 and comes back last. A reload alone does not reorder: the saved layout is read in its saved order (G29's rows pass on base). Patch: no change.
27. Base, the G35 rows on c17b: "expected [ Array(2) ] to have a length of 3 but got 2" (a resize is not followed by a read of the pane) and v1 'written after the read' sent before v0; "Tests 2 failed | 13 passed (15)". A real tmux probe of 40 first attaches: output lost in 12, and in 18 on a second run.
28. Base (reading): UpdateTray draws the date and the schedule words in one cell parted by a CSS `content: '|'`, so they run together. Patched: separate grid cells, read through a computed catalogue key.
29. Base, the G35 recover row on c17b (`-t "keeps the recovery terminal"`): "AssertionError: expected [ Array(2) ] to deep equally contain [ 'set-option', '-t', ...(3) ]", "Tests 1 failed | 4 skipped (5)": the recover command starts as a plain terminal, which tmux does not keep once its command ends. Base (reading): an ended terminal's hover names neither folder nor status.
30. Base (reading): the Venues intro is two inline tags in a flex row whose gap reads as a space before the full stop; pillars.yml:7 and domains.yml:5 open "My ...", domains.yml:5 names `registries/domains.yml`, data.yml:8 ends "<code>collections:</code>."; Venues, Pillars and Domains draw no hub `intro:`. The G5 rows: see case 36.
31. Base (reading): CommandCenterView.svelte's `.behind` is a wrapping flex row with a 5px gap, so the glyph and count, the words and the links are separate flex pieces. Patch: no change.
32. Base, the G40 rows on c17b: both fail (a headless record gets no prompt and no title; the cache serves the old record to a reader of another version).
33. Base (reading): every hub's session group reads the generic "HUB"; the Pin list shows same-titled projects alike. Patched: model-sessions.ts, group.ts, folds.ts and SessionWorkspace.svelte carry a hub name per group (taken out; see item 33).
34. Base (reading): the Make entries wait on an offer request at the press (picks.svelte.ts). The G61 patch rows on c17b: 4 failed ("expected 2 to be 1" twice, "cache.quiet is not a function", "defaults is not a function"). The G32 rows on c17b: "Tests 11 failed | 14 passed (25)" ("expected [ ...(2) ] to deeply equal [ ...(2) ]" for the marks row, "markedBy is not a function" for the table rows). Patched: the offers fetched as the menu opens and cached between presses, still a round trip before the entries show.
35. Base (reading): TabView.svelte draws the view with no boundary, so a view that throws takes the pane with it.
36. Base, the G5 rows on c17b: both fail ("to contain 'class="katex"'", "'class="math-error"'").
37. Base (reading): card.ts:21 `SESSION_VIEWS = ['session-list', 'session-detail', 'timeline']`, no `transcript`, so a pick on a page with only a Transcript tab opens a session-detail beside it.
38. Base (reading): a PDF preview is a pdf.js viewer box in the page, no iframe (views/sources/file/pdf/); an app frame is an iframe. Kill disarms on a pointerdown in the page's document only.
39. Base (reading): CardActions.svelte:209-210 `opacity: var(--card-reveal)` with a transition, and the same opacity rule on Usage's, RadarCard's, InboxCard's, PostCard's and LeadCard's controls, so a hidden control keeps its room.
40. Base: the grep prints catalog.yaml:63 "Feeds the cockpit's Lit Watch radar", career.yml:1 "...(build.py career_panel_html)" and venues.yml:1-4 "build.py venues_tab_html()".
41. The table under "The start patch" below.

## DONE / NOT DONE

| Item | State | Cause | Change | Check and its output |
| --- | --- | --- | --- | --- |
| 1 | DONE | each count read the many form at 1 | `_one` keys in repositories.yml (93, 113-121, 132, 148, 162, 178, 198, 282) and changes.yml (20-52); their readers Merge.svelte:184 and :260, change-menu.ts:151 and :265, RepoList.svelte:190, AppSourceItem.svelte:62, Repo.svelte:207-214, RepoItems.svelte:128 and :137, repositories.ts:849 and :866, Changes.svelte:187, ChangesRepository.svelte:102, HunkBar.svelte:123 | `grep -rn "<key>\b" src` names a reader for each `_one` key; keys.test.ts "Tests 8 passed (8)" (every key read, every read a key) |
| 2 | DONE | the parser passed `T` with no words or tone, and the diff split it into two halves offering block actions | parse.ts, reads.ts `typeChanged`, diff-hunks.ts, repositories.ts STATUS_WORDS/TONES, DiffSection.svelte, HunkBar.svelte, keys.test.ts status list holds `T` | G33 row 'stages a path whose type changed and discards it, the whole path each time' (git-write.test.ts) in the guarded run "Test Files 26 passed (26)" |
| 3 | DONE | text buttons in a nowrap row | MergeSide.svelte:76-98 a `.lens` line of plain ToolButtons parted by bars, wrapping (`flex-wrap`, `overflow-wrap: anywhere`), the link look on the view's own `.link` box (:170-174) | boundaries.test.ts "Tests 11 passed (11)"; the look |
| 4 | DONE | glyph rows showed the key | choices.ts, quick-pick.ts, GlyphDialog, GlyphList, GlyphSelect, FieldSelect, QuickPick | case 4's patched output; the look |
| 5 | DONE | the placement key held edges and radii, and a change of the node set remounted the map | layout.ts, forces.ts, Graph.svelte, follow.svelte.ts | `node -e` notes/c5.js: "link written: moved 0 of 47", "link removed: moved 0", "node removed: moved 0 left 46", "node added: moved 0 new at 639.261,483.432 from its line 53.5 overlaps 0", "grown to 1300x600: offsets kept true" |
| 6 | DONE | labels were checked against labels and nodes only, with no pull off the walls | labels.ts, forces.ts, layout.ts | notes/place-time.js, worktree "on a wall 0", "ms 291.3 190.6 155.6 149.0 147.5 150.3 156.1 143.8 144.3 247.9"; base at the same moment "on a wall 9", "ms 92.0 64.5 55.6 53.9 54.9 62.5 59.8 58.4 61.4 54.1". The increase is the settle: "settle ticks 900 ms 141.3" against "settle ticks 300 ms 54.9", neato "15.3" against "13.2": the settle runs three times the ticks, each also moving labels off edges and nodes off the walls |
| 7 | DONE | a fixed 1000x680 box under `meet` | graph.ts (the box is the pane's size), pointer.ts, Graph.svelte | reading; the look |
| 8 | DONE | twelve fixture exports were used nowhere and eight only in their own file | the test files marked 8 in the start-patch table; four fixture files deleted | the twenty greps now: 14 print nothing; useClock (lsp-fixture.ts), REPOSITORY_MANIFEST and RepositoryTarget (write-fixture.ts) print lines with no export; Copies (hubs-fixture.ts:22 `type Copies`), PersonalTarget (write-fixture.ts:386) and Planted (apps-fixture.ts:37) are local types, and their lines holding `export` are `export function copies(): Copies` (:24), `personalTarget(...)` (:392) and `plant(...)` (:55), `routeSetup(...)` (:139), functions whose signatures name the type |
| 9 | DONE | the code marking the popover's controls ran as an effect after `bind:this` set the element to null | Toolbar.svelte:93-102 `markPanel` is the box's attachment: it holds the box at :95 and lets it go at :101 when the box goes; focusFirst reads it at :108 | reading; the look |
| 10 | DONE | a fixed-width list | list/list-width.svelte.ts, list/TerminalList.svelte (515 lines), bar/TerminalActions.svelte (a terminals menu while no list is drawn: `switching`, `current`, `onshow`), terminal.yml `terminal_switch` | reading; the look |
| 11 | DONE | opacity 0 kept the room | TreeActions.svelte:30 `display: var(--actions-display, none)`, TreeItem.svelte, CommitRow, GraphHead | reading; the look |
| 12 | DONE | onSaved dropped a save made before the settings | saves.ts, builds.ts, latex.svelte.ts `settingsMoved` | `node -e` createSaves (two saves of paper/main.tex and one of paper/intro.tex, one main): "on_save builds 1", "never builds 0" |
| 13 | DONE | the scrim was the page colour; pdf.js's global sheet styled `.dialog` | tokens.css:114 `--scrim`, Modal.svelte:191, ScheduleDialog class `box`, server/root/styles/pdf-styles.ts `scopePdfStyles` (wired in vite.config.ts) wraps pdf_viewer.css in `@scope (.oc-pdf)` | reading; the look |
| 14 | DONE | a second pick changed neither the look nor the code theme | ui.svelte.ts `editorLook()`, look.ts, Editor.svelte, DiffEditor, source/Editor, Diff, DepositFile, Merge | reading; the look |
| 15 | DONE | the shown session lived only in the page's selection | selection.svelte.ts `keepShown`, `followedSession`; SessionPicker; Files.svelte | reading; the look |
| 16 | DONE | a page's save wrote its envelope over a newer one another page had written, dropping that page's tabs | saved/storage.ts: a save is refused when the key moved since this page read it, and the operation runs again on the envelope that stands | G29 row: base failed (case 16); after, tests/state/workbench/layout/saved "Test Files 3 passed (3)", "Tests 24 passed (24)" |
| 17 | DONE | two writers of `.svelte-kit/types` with no lock, and a sync over whole types skipped | vite.config.ts `typesLocked`, `lockTypes`, `TYPES_WRITTEN` (:76); json.ts `takeLock`, `processRuns`; tests/tiers/landing.mjs, quick.mjs, run.mjs | c17w after: two vitest at once "round 1: types same marks: 0" three times; vitest then sync, "svelte-kit types: waiting for the vitest runs <pid>", both exit 0, "types same"; sync killed at 1.9 s, the next run "took over .../oculus-types.lock, whose process has ended", "next run exit 0 took 7 s", "after: types same" |
| 18 | DONE | the read stopped at chunk 512 and at the first segment | images.ts, memories.ts | notes/c18.js after: late-exif.png and .jpg {"width":20,"height":40}; many-no-exif.png "ms 33.4 23.4 21.1 20.6 22.3", no turn; zero-seg.jpg and overrun-seg.jpg null, "ms 0.6 0.1 0.1 0.1 0.1" |
| 19 | DONE | lower-case text | files.yml `read_again: Read again` | `t('files.read_again')` "Read again" |
| 20 | DONE | the picker named by the last segment and a generic hub word; focusout disarmed Kill; split kept after a start | views/shared/sessions/place-names.ts (`placeNames`, `hubPlaces`), WorkspacePicker, kill-arm.svelte.ts, composer.ts `splitEnded`, Composer.svelte, composer.yml `hub_in` | `node -e` placeNames: "research-hub (workspace)", "research-hub (other)", "notes (a)", "a/x", "b/x", "stuff/notes", "hub", "all differ true" |
| 21 | DONE | measured in Times, drawn in Helvetica; one wide graph | utils/diagrams/source.mjs:23 FONT 'Helvetica', stack.mjs, apart.mjs, writes.mjs | writes.svg now width="750pt" height="7086pt", 340 `font-family="Helvetica,Arial,sans-serif"`; diagrams.test.ts --testTimeout=60000 "Tests 47 passed (47)" |
| 22 | DONE (no test) | | | |
| 23 | DONE | the tint effect did not read the model | Editor.svelte:436 the runs read with the model | reading; the look |
| 24 | DONE | config-key and both config-value files were tagged slow with no process, timer or network wait; keys.test.ts parsed a file once per check; comment-width parsed every file; git-scan-depth's root describe ran real git untagged | slow tags removed from config-key, routes config-value and server config-value; keys.test.ts `codeOf` parses each file once; comment-width.test.ts parses only a file holding a long line; git-scan-depth's root describe tagged slow (real git) | each alone after (load 2.81): git-ops 17 passed 32.54s (tests 29.65s, tagged slow: real git); config-key 8 passed 12.70s; detached 1 passed 2.31s; routes config-value 1 passed 4.37s; server config-value 5 passed 5.04s; keys 8 passed 51.64s (transform 24.83s, import 50.55s, tests 986ms); git-scan-depth 12 passed 4.45s; comment-width 2 passed 4.65s, its tree row 1868, 2189 and 2105 ms in three more runs; one earlier run of comment-width, straight after keys, "1 failed", tests 9.29s, its message not captured. `npm run test:quick` over the eight files: "34.5 s (limit 45.0 s); every command passed". No timeout raised |
| 25 | DONE | the empty sentence drew while the rail was unread | RailEditor.svelte:58-59 `read`, :130 `{#if read && rows.length === 0}`, Save waits on `read` (:66) | reading; the look |
| 26 | DONE | opening a view already in the catalogue's pane moved it to the end of the other pane | away.ts:69 `if (open.has(id)) return id;` and :94-97; Catalogue.svelte head | reading; the look |
| 27 | DONE | the pane was read before the resize, and output written between the read and its reply was lost or sent before the screen | channel.ts, capture.ts `paneScreen`, tmux.ts, pty-subscribe.ts, pty-wire.ts | pty folder after "Tests 17 passed (17)"; the tmux probe after: output lost in 0 and 0 of 40 |
| 28 | DONE | one cell and a CSS bar | UpdateTray.svelte:78-79 (two literal keys), app.yml | keys.test.ts passes; the look |
| 29 | DONE | the recover command was a plain terminal, so tmux dropped it when its command ended; the hover had no status | routes.ts starts it as a task (`task: { repo, name: 'recover <key>' }`), kept by `remain-on-exit` (pty/sessions.ts:619) with its status (the fourteenth field) and its start folder (`#{session_path}` once the pane ended); terminal.yml `terminal_row_ended` | the recover row after "Tests 1 passed" (base failed, case 29) |
| 30 | DONE | catalogue intros spoke as "My" and named the hub's paths; the intro's flex gap read as a space | Intro.svelte (one paragraph); venues.yml, pillars.yml, domains.yml, data.yml catalogue lines; findings.yml; person.yml; the hub files' `intro:` lines; RegistryHead.svelte draws the hub's `intro:` once for Pillars, Domains, Data and Venues, through the sanitiser | the hub diffs: domains one hunk (2a3,4), pillars one hunk (25a26,27), venues the head comment and the intro (1,4c1 and 13a11,12); html-sites.test.ts and duplication.test.ts pass |
| 31 | DONE | three flex pieces | CommandCenterView.svelte: `.behind` is a line of text (line-height 1.5), the glyph and count in a nowrap `.lead` span, the links after | boundaries.test.ts passes; the look |
| 32 | DONE | a headless record has no origin mark, so no prompt or title was taken; the fold cache was not keyed on the reader | fold.ts, cache.ts `CACHE_VERSION = 8`, turns.ts | G40 rows after "14 passed" (transcripts.test.ts) |
| 33 | DONE | each hub's group read the generic "HUB"; Pin choices were told apart by nothing | SessionList.svelte and Customizations.svelte name groups through place-names.ts; selectors.svelte.ts adds the folder to every label two Pin choices share | reading; the look |
| 34 | DONE | the menu fetched the offer at the press; each request parsed every other hub's settings | config half: config-cache.ts, server-context.ts, context.ts, the routes and readers marked 34; explorer half: hub-names.ts `FolderMarks`, `makeOffer`, `offerAlong`; make.ts `folderMarks`, `hubAbove`, `markedBy`; fs.ts `withMarks` and the marks in the workspaces answer; git.ts lists the parent of a folder whose marks a write may change (repos/depth.ts holds `mayChangeRepositories`); fs-transport.ts `marksShape`; place.ts `heldOffer`; making.svelte.ts `offerAt`, `startHub`, `client.fs.invalidate()` after a make; picks.svelte.ts | G61 rows "13 passed"; G32 rows "Tests 25 passed (25)" |
| 35 | DONE | no boundary | TabView.svelte:54-65 `<svelte:boundary>` with `failed(error: unknown, reset: () => void)`, `said()`, keys `app.view_failed` and `app.view_retry` (app.yml:299-300) | svelte-check "0 ERRORS 0 WARNINGS"; reading |
| 36 | DONE | card text went through inlineMarkdown with no math | card-math.svelte.ts, html.ts, the cards marked 36 in the start-patch table | G5 rows after "8 passed" (html.dom.test.ts) |
| 37 | DONE | SESSION_VIEWS lacked transcript and nothing kept the tab used last | card.ts:21 and `sessionTab`; attention.ts `used`; instances.ts and layout.svelte.ts `usedInstances`; CardSessions.svelte | tests/state/workbench "Test Files 7 passed (7)", "Tests 137 passed (137)"; reading |
| 38 | DONE | a press inside an iframe never reaches the page's document | kill-arm.svelte.ts:96-104 the window's `blur` ends the arm | reading; the look |
| 39 | DONE | opacity 0 kept the room | Card.svelte `--card-at-rest` (:106-136); CardActions.svelte, Usage.svelte, RadarCard, InboxCard, PostCard, LeadCard read `display: var(--card-at-rest, <own>)`; DESIGN.md:718 | reading; the look |
| 40 | DONE | the three files named the cockpit | catalog.yaml:63, career.yml:1, venues.yml head comment | `grep -n -i 'cockpit\|build.py' ../skills/catalog.yaml ../../registries/career.yml ../../registries/venues.yml`: no line, exit 1; `diff O37-base/hub/career.yml ../../registries/career.yml`: one changed line |
| 41 | DONE (nothing for the builder) | | | |
| 42 | DONE | | the table under "The start patch" | |
| 43 | DONE | | the looks at the end | |

The verify list after the last change:

- ASCII gate (the perl line of spec.md:100): no output, exit 0. The non-ASCII lines of venues.yml, pillars.yml, domains.yml, career.yml and catalog.yaml against the base copy's: 0 new in each.
- `sh utils/size-check.sh`: exit 0. `utils/folder-check.sh` runs git, so the folders were counted by hand (`ls -A` on every folder of src, tests, utils and config): none over 10; docs/diagrams holds 18, as on base.
- `sh utils/unused-exports.sh` against `O37-base/unused-exports.txt`: no new line; two lines are shorter ("images.ts: READ_CAP" for "READ_CAP, SEGMENTS"; "forces.ts: FORCES" for "FORCES, advance").
- Case 8's greps: as in item 8.
- The guarded entries' tests (html.dom, the pty folder, transcripts, config-cache, make, layout saved, size, keys, git-failure, git-write, the terminal and compose routes, manifests, the config checks, html-sites, career, registries, collections): "Test Files 26 passed (26)", "Tests 368 passed | 8 skipped (376)"; channel.test.ts and make.test.ts again after their last change: "Tests 17 passed (17)" (pty folder), make with workspace-follow "Tests 31 passed (31)".
- `npm run test:checks`: "Test Files 19 passed (19)", "Tests 297 passed | 8 skipped (305)".
- `npm run diagrams`: exit 0. Then `npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout=60000`: "Test Files 1 passed (1)", "Tests 47 passed (47)".
- `npm run test:quick -- $(cat changed-paths.txt)` (225 paths, 174 test files), the last run: "ok ASCII gate (0.9 s)", "ok svelte-kit sync (2.0 s)", "ok prettier (3.1 s)", "ok eslint (10.1 s)", "ok svelte-check (13.6 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "ok vitest (70.1 s)", "test:quick: 72.1 s (limit 45.0 s); every command passed", "test:quick: over the time limit". The limit is passed because the list selects 174 test files; over item 24's eight files it is 34.5 s.

## The number of full verify-list runs

Three runs of `npm run test:quick` over the whole changed list. The first had reds in my files (svelte-check: TabView's snippet parameters untyped; eslint: making.svelte.ts:127 an optional chain, make.test.ts:403 an untyped JSON.parse) and one vitest timeout in tests/server/root/workspace-follow.test.ts, a file I did not change, which then passed alone (its row 661ms; with make.test.ts "Tests 31 passed (31)"). The second passed. `npm run test:checks` then found reds in my files (a view importing a data module; two views styling a primitive's classes; two copies of a block, under src and under tests), all fixed at their cause, after which the third list run passed. Whole-suite commands: `npm run test:checks` three times; no `npm test`.

## The start patch

One row per file of the patch: kept (as the patch wrote it), fixed (the patch's change kept and corrected or finished), taken out (the file is as on base), kept(deleted) (the patch's deletion stands), with the item it serves.

| File | Verdict | Item |
| --- | --- | --- |
| registries/domains.yml | kept | 30 |
| registries/pillars.yml | kept | 30 |
| registries/venues.yml | kept | 30, 40 |
| tools/oculus/DESIGN.md | fixed | 6, 7, 11, 17, 34 |
| tools/oculus/HELP.md | fixed | 5, 7, 15, 29, 36 |
| tools/oculus/config/text/app.yml | kept | 28, 35 |
| tools/oculus/config/text/findings.yml | kept | 30 |
| tools/oculus/config/text/views/boards/person.yml | kept | 30 |
| tools/oculus/config/text/views/sessions/terminal.yml | fixed | 10, 29 |
| tools/oculus/config/text/views/sources/data.yml | kept | 30 |
| tools/oculus/config/text/views/sources/files.yml | kept | 19 |
| tools/oculus/config/text/views/sources/repositories.yml | fixed | 1, 2, 3 |
| tools/oculus/config/text/views/sources/venues.yml | kept | 30 |
| tools/oculus/config/text/views/structure/domains.yml | kept | 30 |
| tools/oculus/config/text/views/structure/pillars.yml | kept | 30 |
| tools/oculus/src/lib/data/index.ts | kept | 34 |
| tools/oculus/src/lib/data/model/model-sessions.ts | taken-out | 33 |
| tools/oculus/src/lib/server/content/images.ts | fixed | 18 |
| tools/oculus/src/lib/server/content/memories.ts | kept | 18 |
| tools/oculus/src/lib/server/core/git/parse.ts | kept | 2 |
| tools/oculus/src/lib/server/core/git/reads.ts | kept | 2 |
| tools/oculus/src/lib/server/core/json.ts | fixed | 17 |
| tools/oculus/src/lib/server/edit/feeds/feed-route.ts | kept | 34 |
| tools/oculus/src/lib/server/edit/feeds/feeds.ts | kept | 34 |
| tools/oculus/src/lib/server/edit/feeds/literature.ts | kept | 34 |
| tools/oculus/src/lib/server/edit/writes.ts | kept | 34 |
| tools/oculus/src/lib/server/files/project/project-files.ts | kept | 34 |
| tools/oculus/src/lib/server/files/roots.ts | kept | 34 |
| tools/oculus/src/lib/server/machine/pty/routes.ts | kept | 29, 34 |
| tools/oculus/src/lib/server/machine/pty/sessions.ts | fixed | 29 |
| tools/oculus/src/lib/server/machine/pty/start/chat.ts | kept | 34 |
| tools/oculus/src/lib/server/machine/runs/schedules/record.ts | kept | 17 |
| tools/oculus/src/lib/server/machine/runs/seeds/task-start.ts | kept | 34 |
| tools/oculus/src/lib/server/root/context.ts | kept | 34 |
| tools/oculus/src/lib/server/root/process/build-folders.ts | taken-out | 17 |
| tools/oculus/src/lib/server/root/process/config-cache.ts | kept | 34 |
| tools/oculus/src/lib/server/root/process/server-context.ts | kept | 34 |
| tools/oculus/src/lib/server/root/watch/portfolio.ts | kept | 34 |
| tools/oculus/src/lib/server/root/watch/repos/git-start.ts | kept | 34 |
| tools/oculus/src/lib/server/sessions/cache.ts | kept | 32 |
| tools/oculus/src/lib/server/sessions/fold.ts | kept | 32 |
| tools/oculus/src/lib/server/sessions/group.ts | taken-out | 33 |
| tools/oculus/src/lib/server/sessions/stores/turns.ts | kept | 32 |
| tools/oculus/src/lib/shell/panes/TabView.svelte | fixed | 35 |
| tools/oculus/src/lib/shell/rail/ScheduleDialog.svelte | kept | 13 |
| tools/oculus/src/lib/shell/rail/UpdateTray.svelte | fixed | 28 |
| tools/oculus/src/lib/state/boards/structure/forces.ts | fixed | 5, 6 |
| tools/oculus/src/lib/state/boards/structure/graph.ts | kept | 7 |
| tools/oculus/src/lib/state/boards/structure/layout.ts | fixed | 5, 6 |
| tools/oculus/src/lib/state/client/selectors.svelte.ts | fixed | 15, 33 |
| tools/oculus/src/lib/state/sessions/folds.ts | taken-out | 33 |
| tools/oculus/src/lib/state/sessions/latex/builds.ts | kept | 12 |
| tools/oculus/src/lib/state/sessions/latex/latex.svelte.ts | kept | 12 |
| tools/oculus/src/lib/state/sessions/latex/saves.ts | fixed | 12 |
| tools/oculus/src/lib/state/sessions/terminal/composer/composer.ts | kept | 20 |
| tools/oculus/src/lib/state/sources/repositories/diff/diff-hunks.ts | kept | 2 |
| tools/oculus/src/lib/state/sources/repositories/repositories.ts | fixed | 1, 2 |
| tools/oculus/src/lib/state/workbench/selection.svelte.ts | kept | 15 |
| tools/oculus/src/lib/state/workbench/ui.svelte.ts | kept | 14 |
| tools/oculus/src/lib/themes/tokens.css | kept | 13 |
| tools/oculus/src/lib/ui/controls/editor/Editor.svelte | fixed | 14, 23 |
| tools/oculus/src/lib/ui/controls/editor/diff/DiffEditor.svelte | kept | 14 |
| tools/oculus/src/lib/ui/controls/editor/kit/look.ts | kept | 14 |
| tools/oculus/src/lib/ui/forms/choice/GlyphDialog.svelte | kept | 4 |
| tools/oculus/src/lib/ui/forms/choice/GlyphList.svelte | kept | 4 |
| tools/oculus/src/lib/ui/forms/choice/GlyphSelect.svelte | kept | 4 |
| tools/oculus/src/lib/ui/forms/choice/QuickPick.svelte | kept | 4 |
| tools/oculus/src/lib/ui/forms/choice/choices.ts | kept | 4 |
| tools/oculus/src/lib/ui/forms/choice/quick-pick.ts | kept | 4 |
| tools/oculus/src/lib/ui/forms/choice/select/FieldSelect.svelte | kept | 4 |
| tools/oculus/src/lib/ui/frame/Modal.svelte | kept | 13 |
| tools/oculus/src/lib/ui/frame/toolbar/Toolbar.svelte | fixed | 9 |
| tools/oculus/src/lib/ui/html.ts | kept | 36 |
| tools/oculus/src/lib/ui/tree/TreeItem.svelte | fixed | 11 |
| tools/oculus/src/lib/ui/tree/TreeView.svelte | taken-out | 34 |
| tools/oculus/src/lib/ui/tree/row/TreeActions.svelte | fixed | 11 |
| tools/oculus/src/lib/views/boards/collection/Collection.svelte | fixed | 36 |
| tools/oculus/src/lib/views/boards/deposit/DepositFile.svelte | kept | 14 |
| tools/oculus/src/lib/views/feeds/inbox/InboxCard.svelte | fixed | 36, 39 |
| tools/oculus/src/lib/views/feeds/leads/Leads.svelte | fixed | 36 |
| tools/oculus/src/lib/views/sessions/session-list/SessionWorkspace.svelte | taken-out | 33 |
| tools/oculus/src/lib/views/sessions/terminal/RenameField.svelte | kept | 10 |
| tools/oculus/src/lib/views/sessions/terminal/Terminal.svelte | fixed | 10, 20 |
| tools/oculus/src/lib/views/sessions/terminal/TerminalTitle.svelte | kept | 10 |
| tools/oculus/src/lib/views/sessions/terminal/app-menus.ts | kept | 10 |
| tools/oculus/src/lib/views/sessions/terminal/bar/TerminalBar.svelte | kept | 10 |
| tools/oculus/src/lib/views/sessions/terminal/TerminalList.svelte | moved-to-list/,fixed | 10, 20 |
| tools/oculus/src/lib/views/sessions/terminal/list/kill-arm.svelte.ts | fixed | 20, 38 |
| tools/oculus/src/lib/views/sessions/terminal/list/list-width.svelte.ts | kept | 10 |
| tools/oculus/src/lib/views/sessions/terminal/start/Composer.svelte | fixed | 20 |
| tools/oculus/src/lib/views/sessions/terminal/terminal-list.ts | fixed | 10, 20 |
| tools/oculus/src/lib/views/shared/card/card.ts | fixed | 37 |
| tools/oculus/src/lib/views/shared/card/feed/LeadCard.svelte | fixed | 36, 39 |
| tools/oculus/src/lib/views/shared/card/feed/RadarCard.svelte | fixed | 36, 39 |
| tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte | taken-out | 34 |
| tools/oculus/src/lib/views/shared/explorer/tree/control/making.svelte.ts | fixed | 34 |
| tools/oculus/src/lib/views/shared/explorer/tree/control/picks.svelte.ts | fixed | 34 |
| tools/oculus/src/lib/views/shared/forms/entry/EntryCard.svelte | fixed | 36 |
| tools/oculus/src/lib/views/shared/forms/registry/RegistryCard.svelte | fixed | 36 |
| tools/oculus/src/lib/views/shared/graph/Graph.svelte | fixed | 5, 6, 7 |
| tools/oculus/src/lib/views/shared/graph/follow.svelte.ts | fixed | 5, 7 |
| tools/oculus/src/lib/views/shared/graph/labels.ts | kept | 6 |
| tools/oculus/src/lib/views/shared/graph/pointer.ts | kept | 7 |
| tools/oculus/src/lib/views/shared/latex/card-math.svelte.ts | fixed | 36 |
| tools/oculus/src/lib/views/shared/prose/Intro.svelte | fixed | 30 |
| tools/oculus/src/lib/views/shared/sessions/SessionPicker.svelte | kept | 15 |
| tools/oculus/src/lib/views/shared/sessions/WorkspacePicker.svelte | fixed | 20 |
| tools/oculus/src/lib/views/sources/data/Data.svelte | fixed | 30, 36 |
| tools/oculus/src/lib/views/sources/data/DatasetCard.svelte | fixed | 36 |
| tools/oculus/src/lib/views/sources/files/Files.svelte | kept | 15 |
| tools/oculus/src/lib/views/sources/repositories/diff/Diff.svelte | kept | 14 |
| tools/oculus/src/lib/views/sources/repositories/diff/DiffSection.svelte | fixed | 2 |
| tools/oculus/src/lib/views/sources/repositories/diff/HunkBar.svelte | fixed | 2 |
| tools/oculus/src/lib/views/sources/repositories/graph/CommitRow.svelte | kept | 11 |
| tools/oculus/src/lib/views/sources/repositories/graph/GraphHead.svelte | kept | 11 |
| tools/oculus/src/lib/views/sources/repositories/merge/Merge.svelte | kept | 1, 14, 23 |
| tools/oculus/src/lib/views/sources/repositories/merge/MergeSide.svelte | fixed | 3 |
| tools/oculus/src/lib/views/sources/source/Editor.svelte | kept | 14 |
| tools/oculus/src/lib/views/sources/venues/VenueCard.svelte | fixed | 36 |
| tools/oculus/src/lib/views/sources/venues/Venues.svelte | taken-out | 30 |
| tools/oculus/src/lib/views/structure/domains/DomainCard.svelte | fixed | 36 |
| tools/oculus/src/lib/views/structure/domains/Domains.svelte | taken-out | 30 |
| tools/oculus/src/lib/views/structure/pillars/LineCard.svelte | fixed | 36 |
| tools/oculus/src/lib/views/structure/pillars/Pillars.svelte | taken-out | 30 |
| tools/oculus/src/routes/api/(docs)/deck/+server.ts | kept | 34 |
| tools/oculus/src/routes/api/(docs)/docs/+server.ts | kept | 34 |
| tools/oculus/src/routes/api/(docs)/memories/+server.ts | kept | 18, 34 |
| tools/oculus/src/routes/api/(docs)/wallpaper/+server.ts | kept | 34 |
| tools/oculus/src/routes/api/(files)/project-files/+server.ts | kept | 34 |
| tools/oculus/src/routes/api/(sessions)/terminal/+server.ts | kept | 29, 34 |
| tools/oculus/tests/checks/source/keys.test.ts | fixed | 24 |
| tools/oculus/tests/data/hubs/hubs-fixture.ts | kept | 8, 34 |
| tools/oculus/tests/data/sources/manifests.test.ts | kept | 34 |
| tools/oculus/tests/fixtures/client.ts | kept | 8 |
| tools/oculus/tests/fixtures/doubles.ts | fixed | 8 |
| tools/oculus/tests/fixtures/entities-fixture.ts | kept | 8 |
| tools/oculus/tests/fixtures/feeds-fixture.ts | kept(deleted) | 8 |
| tools/oculus/tests/fixtures/hubs/collections.ts | kept | 8 |
| tools/oculus/tests/fixtures/hubs/deposit-world.ts | kept | 34 |
| tools/oculus/tests/fixtures/hubs/real-hub.ts | kept | 8 |
| tools/oculus/tests/fixtures/hubs/workspace.ts | kept | 8 |
| tools/oculus/tests/fixtures/sessions-fixture.ts | kept | 8 |
| tools/oculus/tests/routes/apps/apps-fixture.ts | kept | 8 |
| tools/oculus/tests/routes/edit/audit-mute.test.ts | kept | 34 |
| tools/oculus/tests/routes/edit/write-fixture.ts | kept | 8, 34 |
| tools/oculus/tests/routes/sessions/compose.test.ts | kept | 34 |
| tools/oculus/tests/routes/sessions/terminal-fixture.ts | kept | 34 |
| tools/oculus/tests/routes/sessions/terminal.test.ts | kept | 29, 34 |
| tools/oculus/tests/server/files/history-fixture.ts | kept(deleted) | 8 |
| tools/oculus/tests/server/git/git-scan-depth.test.ts | kept | 24 |
| tools/oculus/tests/server/machine/apps/world/credit-sender.ts | kept | 8 |
| tools/oculus/tests/server/machine/apps/world/hosts-world.ts | kept | 8 |
| tools/oculus/tests/server/machine/apps/world/language-app.ts | kept | 8 |
| tools/oculus/tests/server/machine/line-counts.ts | kept(deleted) | 8 |
| tools/oculus/tests/server/machine/lsp/lsp-fixture.ts | kept | 8 |
| tools/oculus/tests/server/root/config-cache.test.ts | kept | 34 |
| tools/oculus/tests/server/root/context-fixture.ts | fixed | 34 |
| tools/oculus/tests/tiers/landing.mjs | fixed | 17 |
| tools/oculus/tests/tiers/quick.mjs | kept | 17, 24 |
| tools/oculus/tests/tiers/run.mjs | kept | 17 |
| tools/oculus/tests/ui/controls/editor/monaco-diff.ts | kept(deleted) | 8 |
| tools/oculus/utils/diagrams/diagrams.mjs | kept | 21 |
| tools/oculus/utils/diagrams/drawing/apart.mjs | kept | 21 |
| tools/oculus/utils/diagrams/drawing/stack.mjs | kept | 21 |
| tools/oculus/utils/diagrams/source.mjs | kept | 21 |
| tools/oculus/utils/diagrams/writes.mjs | kept | 21 |
| tools/oculus/vite.config.ts | fixed | 13, 17 |
| tools/data/README.md | not-in-this-worktree | decision 2 |
| tools/deposit/deposit.py | not-in-this-worktree | decision 2 |
| tools/skills/catalog.yaml | kept | 40 |
| registries/career.yml | kept | 40 |

The files of the patch not in this worktree (decision 2) are `tools/data/README.md` and `tools/deposit/deposit.py`. Files changed beyond the patch, each for the item named in the DONE table: hub-names.ts, fs.ts, make.ts, git.ts, repos/depth.ts, place.ts, fs-transport.ts, making.svelte.ts and picks.svelte.ts (34); capture.ts, channel.ts, tmux.ts, pty-subscribe.ts, pty-wire.ts, terminals.svelte.ts (27); registry.ts (`systemProbe.running` reads json.ts's `processRuns`, item 17's helper, in place of its own copy); styles/pdf-styles.ts and styles/style-first.ts (13; style-first.ts moved from root/); away.ts, Catalogue.svelte (26); attention.ts, instances.ts, layout.svelte.ts, layout/index.ts, CardSessions.svelte (37); storage.ts (16); Card.svelte, CardActions.svelte, PostCard.svelte, Usage.svelte (39); RegistryHead.svelte (30); CommandCenterView.svelte (31); SessionList.svelte, Customizations.svelte, place-names.ts, composer.yml (20, 33); RailEditor.svelte (25); changes.yml, ChangesRepository.svelte, Changes.svelte, change-menu.ts, RepoItems.svelte, RepoList.svelte, AppSourceItem.svelte, hunk-acts.svelte.ts (1); TerminalActions.svelte (10); NotesGraph.svelte, Map.svelte (5); the tests in "Guarded rows" and "Edits to existing tests".

## Files with line counts

Every changed file under tools/oculus with its line count now and on base ("new" for a new file); the docs/diagrams/*.dot and *.svg files that `npm run diagrams` regenerated are left out. The hub files: registries/venues.yml 1077, pillars.yml 99, domains.yml 78, career.yml 98, tools/skills/catalog.yaml 1492. The largest are context.ts 880, terminals.svelte.ts 879, git.ts 876, repositories.ts 876, layout.svelte.ts 871 (limit 880); EntryCard.svelte and Diff.svelte 520 (limit 520). New subfolders: `src/lib/server/root/styles/` (2 items: pdf-styles.ts, style-first.ts) and `src/lib/views/sessions/terminal/list/` (3 items: TerminalList.svelte, kill-arm.svelte.ts, list-width.svelte.ts).

| File | Lines | Base |
| --- | --- | --- |
| config/text/app.yml | 308 | 303 |
| config/text/findings.yml | 345 | 345 |
| config/text/views/boards/person.yml | 32 | 32 |
| config/text/views/sessions/changes.yml | 103 | 101 |
| config/text/views/sessions/composer.yml | 63 | 63 |
| config/text/views/sessions/terminal.yml | 114 | 111 |
| config/text/views/sources/data.yml | 20 | 20 |
| config/text/views/sources/files.yml | 300 | 300 |
| config/text/views/sources/repositories.yml | 334 | 319 |
| config/text/views/sources/venues.yml | 39 | 39 |
| config/text/views/structure/domains.yml | 8 | 8 |
| config/text/views/structure/pillars.yml | 23 | 23 |
| DESIGN.md | 759 | 759 |
| HELP.md | 503 | 501 |
| src/lib/data/helpers/hub-names.ts | 366 | 325 |
| src/lib/data/index.ts | 867 | 859 |
| src/lib/server/content/images.ts | 357 | 332 |
| src/lib/server/content/memories.ts | 186 | 185 |
| src/lib/server/core/git/parse.ts | 828 | 819 |
| src/lib/server/core/git/reads.ts | 466 | 423 |
| src/lib/server/core/json.ts | 296 | 175 |
| src/lib/server/edit/feeds/feed-route.ts | 162 | 162 |
| src/lib/server/edit/feeds/feeds.ts | 788 | 788 |
| src/lib/server/edit/feeds/literature.ts | 259 | 257 |
| src/lib/server/edit/writes.ts | 772 | 752 |
| src/lib/server/files/fs.ts | 534 | 498 |
| src/lib/server/files/project/make.ts | 274 | 240 |
| src/lib/server/files/project/project-files.ts | 260 | 258 |
| src/lib/server/files/roots.ts | 121 | 117 |
| src/lib/server/machine/pty/capture.ts | 305 | 205 |
| src/lib/server/machine/pty/channel.ts | 820 | 836 |
| src/lib/server/machine/pty/routes.ts | 575 | 559 |
| src/lib/server/machine/pty/sessions.ts | 837 | 836 |
| src/lib/server/machine/pty/start/chat.ts | 135 | 138 |
| src/lib/server/machine/pty/tmux.ts | 460 | 411 |
| src/lib/server/machine/runs/schedules/record.ts | 295 | 339 |
| src/lib/server/machine/runs/seeds/task-start.ts | 126 | 124 |
| src/lib/server/root/context.ts | 880 | 871 |
| src/lib/server/root/process/config-cache.ts | 218 | 146 |
| src/lib/server/root/process/server-context.ts | 183 | 181 |
| src/lib/server/root/styles/pdf-styles.ts | 36 | new |
| src/lib/server/root/styles/style-first.ts | 43 | new |
| src/lib/server/root/watch/git.ts | 876 | 878 |
| src/lib/server/root/watch/portfolio.ts | 851 | 841 |
| src/lib/server/root/watch/repos/depth.ts | 21 | new |
| src/lib/server/root/watch/repos/git-start.ts | 93 | 95 |
| src/lib/server/sessions/cache.ts | 127 | 126 |
| src/lib/server/sessions/fold.ts | 384 | 371 |
| src/lib/server/sessions/registry.ts | 229 | 237 |
| src/lib/server/sessions/stores/turns.ts | 302 | 306 |
| src/lib/shell/panes/TabView.svelte | 86 | 59 |
| src/lib/shell/rail/ScheduleDialog.svelte | 252 | 252 |
| src/lib/shell/rail/UpdateTray.svelte | 277 | 269 |
| src/lib/shell/status/RepoItems.svelte | 246 | 240 |
| src/lib/state/boards/structure/forces.ts | 526 | 194 |
| src/lib/state/boards/structure/graph.ts | 475 | 466 |
| src/lib/state/boards/structure/layout.ts | 318 | 282 |
| src/lib/state/client/selectors.svelte.ts | 724 | 692 |
| src/lib/state/sessions/latex/builds.ts | 835 | 855 |
| src/lib/state/sessions/latex/latex.svelte.ts | 693 | 687 |
| src/lib/state/sessions/latex/saves.ts | 158 | new |
| src/lib/state/sessions/terminal/composer/composer.ts | 509 | 495 |
| src/lib/state/sessions/terminal/pty/pty-subscribe.ts | 136 | 129 |
| src/lib/state/sessions/terminal/pty/pty-wire.ts | 101 | 99 |
| src/lib/state/sessions/terminals.svelte.ts | 879 | 878 |
| src/lib/state/sources/explorer/view/place.ts | 258 | 228 |
| src/lib/state/sources/fs-transport.ts | 515 | 497 |
| src/lib/state/sources/repositories/diff/diff-hunks.ts | 294 | 293 |
| src/lib/state/sources/repositories/repositories.ts | 876 | 837 |
| src/lib/state/workbench/layout.svelte.ts | 871 | 870 |
| src/lib/state/workbench/layout/index.ts | 147 | 148 |
| src/lib/state/workbench/layout/open/attention.ts | 213 | 186 |
| src/lib/state/workbench/layout/open/away.ts | 124 | 122 |
| src/lib/state/workbench/layout/saved/storage.ts | 436 | 423 |
| src/lib/state/workbench/layout/tabs/instances.ts | 409 | 406 |
| src/lib/state/workbench/selection.svelte.ts | 114 | 61 |
| src/lib/state/workbench/ui.svelte.ts | 809 | 793 |
| src/lib/themes/tokens.css | 312 | 308 |
| src/lib/ui/controls/editor/diff/DiffEditor.svelte | 519 | 519 |
| src/lib/ui/controls/editor/Editor.svelte | 520 | 519 |
| src/lib/ui/controls/editor/kit/look.ts | 66 | 66 |
| src/lib/ui/forms/choice/choices.ts | 72 | 51 |
| src/lib/ui/forms/choice/GlyphDialog.svelte | 42 | 64 |
| src/lib/ui/forms/choice/GlyphList.svelte | 96 | 88 |
| src/lib/ui/forms/choice/GlyphSelect.svelte | 55 | 54 |
| src/lib/ui/forms/choice/quick-pick.ts | 12 | 4 |
| src/lib/ui/forms/choice/QuickPick.svelte | 208 | 161 |
| src/lib/ui/forms/choice/select/FieldSelect.svelte | 111 | 106 |
| src/lib/ui/frame/Card.svelte | 240 | 234 |
| src/lib/ui/frame/Modal.svelte | 197 | 193 |
| src/lib/ui/frame/toolbar/Toolbar.svelte | 282 | 277 |
| src/lib/ui/html.ts | 641 | 631 |
| src/lib/ui/tree/row/TreeActions.svelte | 86 | 83 |
| src/lib/ui/tree/TreeItem.svelte | 516 | 513 |
| src/lib/views/boards/collection/Collection.svelte | 503 | 499 |
| src/lib/views/boards/deposit/DepositFile.svelte | 141 | 141 |
| src/lib/views/boards/focus/CommandCenterView.svelte | 370 | 360 |
| src/lib/views/feeds/inbox/InboxCard.svelte | 338 | 336 |
| src/lib/views/feeds/leads/Leads.svelte | 319 | 315 |
| src/lib/views/feeds/linkedin/PostCard.svelte | 115 | 116 |
| src/lib/views/sessions/session-detail/ChangesRepository.svelte | 214 | 212 |
| src/lib/views/sessions/session-list/Customizations.svelte | 246 | 245 |
| src/lib/views/sessions/session-list/SessionList.svelte | 382 | 368 |
| src/lib/views/sessions/terminal/app-menus.ts | 36 | 36 |
| src/lib/views/sessions/terminal/bar/TerminalActions.svelte | 144 | 105 |
| src/lib/views/sessions/terminal/bar/TerminalBar.svelte | 114 | new |
| src/lib/views/sessions/terminal/list/kill-arm.svelte.ts | 160 | new |
| src/lib/views/sessions/terminal/list/list-width.svelte.ts | 117 | new |
| src/lib/views/sessions/terminal/list/TerminalList.svelte | 515 | new |
| src/lib/views/sessions/terminal/RenameField.svelte | 64 | 63 |
| src/lib/views/sessions/terminal/start/Composer.svelte | 519 | 519 |
| src/lib/views/sessions/terminal/terminal-list.ts | 715 | 731 |
| src/lib/views/sessions/terminal/Terminal.svelte | 513 | 523 |
| src/lib/views/sessions/terminal/TerminalTitle.svelte | 105 | 103 |
| src/lib/views/shared/card/card.ts | 158 | 152 |
| src/lib/views/shared/card/CardActions.svelte | 216 | 212 |
| src/lib/views/shared/card/feed/LeadCard.svelte | 270 | 266 |
| src/lib/views/shared/card/feed/RadarCard.svelte | 318 | 316 |
| src/lib/views/shared/card/project/CardSessions.svelte | 122 | 120 |
| src/lib/views/shared/explorer/tree/control/making.svelte.ts | 181 | 149 |
| src/lib/views/shared/explorer/tree/control/picks.svelte.ts | 325 | 333 |
| src/lib/views/shared/forms/entry/EntryCard.svelte | 520 | 519 |
| src/lib/views/shared/forms/registry/RegistryCard.svelte | 117 | 113 |
| src/lib/views/shared/forms/registry/RegistryHead.svelte | 56 | 46 |
| src/lib/views/shared/graph/follow.svelte.ts | 118 | new |
| src/lib/views/shared/graph/Graph.svelte | 509 | 474 |
| src/lib/views/shared/graph/labels.ts | 201 | 117 |
| src/lib/views/shared/graph/pointer.ts | 76 | 75 |
| src/lib/views/shared/latex/card-math.svelte.ts | 31 | new |
| src/lib/views/shared/prose/Intro.svelte | 90 | 88 |
| src/lib/views/shared/sessions/place-names.ts | 62 | new |
| src/lib/views/shared/sessions/SessionPicker.svelte | 101 | 90 |
| src/lib/views/shared/sessions/WorkspacePicker.svelte | 55 | 52 |
| src/lib/views/sources/data/Data.svelte | 150 | 152 |
| src/lib/views/sources/data/DatasetCard.svelte | 245 | 236 |
| src/lib/views/sources/files/Files.svelte | 388 | 377 |
| src/lib/views/sources/notes-graph/NotesGraph.svelte | 113 | 113 |
| src/lib/views/sources/repositories/apps/AppSourceItem.svelte | 78 | 76 |
| src/lib/views/sources/repositories/changes/Changes.svelte | 359 | 357 |
| src/lib/views/sources/repositories/diff/Diff.svelte | 520 | 520 |
| src/lib/views/sources/repositories/diff/DiffSection.svelte | 519 | 520 |
| src/lib/views/sources/repositories/diff/hunk-acts.svelte.ts | 75 | 73 |
| src/lib/views/sources/repositories/diff/HunkBar.svelte | 254 | 229 |
| src/lib/views/sources/repositories/graph/CommitRow.svelte | 327 | 327 |
| src/lib/views/sources/repositories/graph/GraphHead.svelte | 95 | 95 |
| src/lib/views/sources/repositories/menus/change-menu.ts | 293 | 287 |
| src/lib/views/sources/repositories/merge/Merge.svelte | 335 | 331 |
| src/lib/views/sources/repositories/merge/MergeSide.svelte | 184 | 160 |
| src/lib/views/sources/repositories/RepoList.svelte | 299 | 297 |
| src/lib/views/sources/source/Editor.svelte | 385 | 384 |
| src/lib/views/sources/venues/VenueCard.svelte | 332 | 328 |
| src/lib/views/structure/domains/DomainCard.svelte | 60 | 56 |
| src/lib/views/structure/map/Map.svelte | 230 | 233 |
| src/lib/views/structure/pillars/LineCard.svelte | 135 | 131 |
| src/lib/views/system/machine/usage/Usage.svelte | 365 | 367 |
| src/lib/views/system/workbench/Catalogue.svelte | 413 | 412 |
| src/lib/views/system/workbench/RailEditor.svelte | 270 | 265 |
| src/routes/api/(docs)/deck/+server.ts | 36 | 36 |
| src/routes/api/(docs)/docs/+server.ts | 26 | 26 |
| src/routes/api/(docs)/memories/+server.ts | 32 | 28 |
| src/routes/api/(docs)/wallpaper/+server.ts | 21 | 21 |
| src/routes/api/(files)/project-files/+server.ts | 16 | 12 |
| src/routes/api/(sessions)/terminal/+server.ts | 37 | 36 |
| tests/checks/source/comment-width.test.ts | 85 | 79 |
| tests/checks/source/keys.test.ts | 699 | 686 |
| tests/data/hubs/hubs-fixture.ts | 61 | 60 |
| tests/data/sources/manifests.test.ts | 791 | 791 |
| tests/fixtures/client.ts | 70 | 128 |
| tests/fixtures/doubles.ts | 81 | 96 |
| tests/fixtures/entities-fixture.ts | 78 | 106 |
| tests/fixtures/hubs/collections.ts | 31 | 31 |
| tests/fixtures/hubs/deposit-world.ts | 56 | 55 |
| tests/fixtures/hubs/real-hub.ts | 60 | 60 |
| tests/fixtures/hubs/workspace.ts | 94 | 94 |
| tests/fixtures/sessions-fixture.ts | 152 | 198 |
| tests/routes/apps/apps-fixture.ts | 183 | 183 |
| tests/routes/edit/audit-mute.test.ts | 116 | 115 |
| tests/routes/edit/config-key.test.ts | 166 | 167 |
| tests/routes/edit/config-value.test.ts | 50 | 51 |
| tests/routes/edit/write-fixture.ts | 506 | 504 |
| tests/routes/hubs/make.test.ts | 436 | 331 |
| tests/routes/sessions/compose.test.ts | 332 | 332 |
| tests/routes/sessions/terminal-fixture.ts | 276 | 271 |
| tests/routes/sessions/terminal.test.ts | 191 | 161 |
| tests/server/edit/config-value.test.ts | 141 | 148 |
| tests/server/git/git-scan-depth.test.ts | 265 | 264 |
| tests/server/git/git-write.test.ts | 414 | 375 |
| tests/server/machine/apps/tools/terminals/terminals-page.test.ts | 172 | 184 |
| tests/server/machine/apps/world/credit-sender.ts | 52 | 52 |
| tests/server/machine/apps/world/hosts-world.ts | 481 | 481 |
| tests/server/machine/apps/world/language-app.ts | 368 | 368 |
| tests/server/machine/lsp/lsp-fixture.ts | 375 | 375 |
| tests/server/machine/pty/channel.test.ts | 526 | 462 |
| tests/server/root/config-cache.test.ts | 312 | 196 |
| tests/server/root/context-fixture.ts | 211 | 219 |
| tests/server/sessions/transcripts.test.ts | 227 | 141 |
| tests/state/workbench/layout/saved/layout-workspaces.test.ts | 258 | 240 |
| tests/tiers/landing.mjs | 114 | 72 |
| tests/tiers/quick.mjs | 307 | 308 |
| tests/tiers/run.mjs | 107 | 106 |
| tests/ui/html.dom.test.ts | 137 | 119 |
| utils/diagrams/diagrams.mjs | 210 | 207 |
| utils/diagrams/drawing/apart.mjs | 747 | 702 |
| utils/diagrams/drawing/stack.mjs | 152 | new |
| utils/diagrams/source.mjs | 191 | 183 |
| utils/diagrams/writes.mjs | 737 | 558 |
| vite.config.ts | 417 | 190 |

## Judgment calls the brief left open

1. Item 32: the fold cache is keyed by an explicit `CACHE_VERSION` (cache.ts:31, now 8) that names what the reader reads, raised with the reader. A key computed from the reader's own source would need a digest of those files at build time inside the vite.config graph or a new script, and a new script needs Axel's approval, so the version stays a constant raised by hand; a change to the reader that forgets to raise it serves old records until the next raise.
2. Item 34, the marks: each folder entry of a listing carries `marks` (`hub`, `project`, `home`, each only when true) and each workspace folder `marks` and `above`. These are fields of oculus's own /api/fs answer, read by the page alone. Each listed folder costs three `stat` calls. A symlinked folder's marks are read through its real path, while the tree composes the offer down the path as shown, which can differ from the real ancestors; the server asks the offer again at the make and refuses what it would not offer. The collections of Make Folder a Hub's dialog are read at the press, since only the dialog draws them. `mayChangeRepositories` moved from git.ts to `watch/repos/depth.ts` to keep git.ts at 876 lines.
3. Item 39: hidden card controls take no room (`display: none`), so a card grows by the controls' line when it is hovered or focused, and Tab reaches the controls only of the card that holds the focus or the cursor, as DESIGN.md:718 now says.
4. Item 17: `TYPES_WRITTEN` is exported from vite.config.ts, the one module that writes the file it names, and tests/tiers/landing.mjs imports it from there; landing.mjs therefore loads the config module and its imports (`node -e "import('./vite.config.ts')"` prints "TYPES_WRITTEN OCULUS_TYPES_WRITTEN"). Exported from build-folders.ts, a production module, it was a new line of `utils/unused-exports.sh`.
5. Item 30: the hub's `intro:` is drawn by RegistryHead.svelte for all four registry views, above the view's catalogue intro. In the Data view it was the last line of the catalogue intro; it is now its own paragraph above it.
6. Item 31: the glyph and the count stay on one line (`.lead { white-space: nowrap }`); the rest of the sentence wraps as text.
7. Item 3: the choice's hover and keyboard look is set on the view's `.link` box (`.link:hover`, `.link:has(:global(:focus-visible))`), which the plain ToolButton inherits, so no view rule names ToolButton's classes.
8. Item 27: with a program in its alternate screen, a move to the top left comes before the program's screen (capture.ts:186-193), so a screen that starts at the shell's column does not wrap its top row.
9. Item 24: `npm run test:quick` over this step's 225 changed paths selects 174 test files and takes 72.1 s; the 45 s limit holds over the eight named files (34.5 s).

## Host- and user-visible changes

| Where | Before | After |
| --- | --- | --- |
| Repositories counts at 1 (item 1) | "1 conflicts left", "1 changes", "1 files are in conflict." | "1 conflict left", "1 change", "1 file is in conflict." |
| A type-changed file (item 2) | "changed", grey, two halves, Stage Block offered | "type changed" in the modified colour, one file, no block actions |
| Merge editor choices (item 3) | text buttons that overlap at 110 px | code lens links above the conflict, wrapping |
| Glyph pickers (item 4) | keys ("theme_rice") | words ("Theme rice") beside the glyph |
| Map (items 5-7) | relaid on every link and node change, labels across edges, bands | nodes kept, labels clear of edges and walls, fills the pane |
| Toolbar popover (item 9) | an error at each close | none |
| Terminal tab (item 10) | fixed 180 px list | draggable width, narrow, hidden below the room, a terminals menu on the bar while hidden |
| Repositories rows (item 11) and cards (item 39) | hidden controls keep their room | hidden controls take none |
| LaTeX auto-build (item 12) | a save before the settings never built | one build when the settings arrive |
| Modal (item 13) | page hidden behind the scrim | dimmed at half black; pdf.js rules stay inside the PDF viewer |
| Code theme (item 14) | a second pick after a failed load did nothing | it loads again |
| Session, Transcript, Timeline, Files tabs (item 15) | empty after a reload | show what they showed |
| Layout across browser tabs (item 16) | a tab could drop another's tabs | a refused save runs again on the newer layout |
| Workspace picker (item 20) | "x" and "x", "hub" | "a/x", "b/x", the hub's own name |
| Help diagrams (item 21) | writes.svg 4225pt wide | 750pt wide in stacked rows; labels measured in the drawn font |
| Rail editor (item 25) | "The rail has no button." while reading | only once read and empty |
| Catalogue (item 26) | an open view moved to the other pane's end | shown where it is |
| Terminal attach (item 27) | first screen could lose output | drawn whole |
| Update tray (item 28) | date and schedule run together | separate cells |
| Recover (item 29) | tab closed on failure | tab kept, the hover names folder and exit status |
| Registry intros (item 30) | "My ...", `registries/` paths, a space before the full stop | neutral words, the hub's `intro:` drawn |
| Sessions groups and Pin (item 33) | "HUB" twice; same titles alike | each hub's name; folder added to a shared title |
| Files menu (item 34) | Make entries after a request | in the menu as it opens |
| A view that throws (item 35) | the pane broken | a message in its tab and Draw again |
| Card text (item 36) | `$...$` as text | math drawn; prices and invalid formulas as text |
| Session card pick (items 37) | always a session-detail beside | the Transcript tab, or the tab used last |
| Kill (items 20, 38) | disarmed by a focus move; a press in a frame did not disarm | kept on focus moves; a press in a frame disarms |

## What in the brief was wrong or impossible

1. Item 38 names "a PDF preview" as an iframe. The PDF preview is a pdf.js viewer drawn in the page (views/sources/file/pdf/viewer.svelte.ts, the `.oc-pdf` box), so a press in it is a pointerdown in the page's document, which already ended the arm on base; only an app frame is an iframe.
2. Item 26's "across reloads": the strip's order changes when the catalogue opens a view the page already holds (away.ts, case 26); a reload reads the saved order as it is.
3. Item 24: "`npm run test:quick` stays inside its 45 s" holds for the files it names (34.5 s); this step's own list of 225 paths takes 72.1 s, since the time grows with the files a change selects.
4. Verify item 3 asks for `sh utils/folder-check.sh`, which runs git, which this brief bans; the count was done by hand instead.

## Guarded rows

Rows added, by entry, file and name (the orchestrator books them in `agents/guarded.md`):

- G5, tests/ui/html.dom.test.ts, describe 'inlineMarkdown': "keeps a hub field's formula as KaTeX's markup and drops a handler written beside it"; 'keeps two dollar prices as text and an invalid formula as its source'. Base: both fail; after: "8 passed".
- G29, tests/state/workbench/layout/saved/layout-workspaces.test.ts, describe 'a browser tab whose arrangement another tab has moved on from': 'takes the saved arrangement and runs its change on it, so no tab of either is lost'. Base: fails; after: passes.
- G32, tests/routes/hubs/make.test.ts, describe 'what the Files view holds of a folder before its menu opens': 'carries the marks of each folder in its listing and of each folder of the workspace in the workspaces answer, and the offer they give each folder is the route offer (G32)'; the table 'names, for a write at %s, the folder whose marks it may change: %s (G32)', ten rows (a/project.yml: a; a/.oculus: a; a/.oculus/config.yml: a; a/.oculus/project.yml: a; a\b\.oculus\config.yml: a/b; project.yml: ''; .oculus/config.yml: ''; a/notes.md: null; a/.oculus/notes/one.md: null; a/.oculus/project.yml.tmp: null). Base: "Tests 11 failed | 14 passed (25)"; after: "Tests 25 passed (25)".
- G33, tests/server/git/git-write.test.ts, describe 'staging': 'stages a path whose type changed and discards it, the whole path each time'. Base: passes (it guards behaviour base had); after: passes.
- G35, tests/server/machine/pty/channel.test.ts: describe 'a page that resizes before it attaches', 'resizes the terminal and reads its pane after the resize'; describe 'the first screen of a page that attaches', 'sends the output written after the pane was read behind the screen, and none before it'. Base: "Tests 2 failed | 13 passed (15)"; after: passes.
- G35, tests/routes/sessions/terminal.test.ts: 'keeps the recovery terminal after its command ended, with its exit status, as a task terminal'. Base: "Tests 1 failed | 4 skipped (5)"; after: "Tests 1 passed | 4 skipped (5)".
- G40, tests/server/sessions/transcripts.test.ts: describe 'a headless session', 'is listed with its prompt and the title it opens with, and its prompt is a turn'; describe 'the sessions cache', 'serves a record from the cache its reader wrote, and folds it again for another reader'. Base: both fail; after: "14 passed".
- G61, tests/server/root/config-cache.test.ts (written by the start patch, kept): "parses another hub's settings once for requests over them, and again once its .oculus/config.yml is written"; 'keeps no parse for a hub outside the open workspace'; 'says the findings of a parse a server reader made once, at the next request'; "parses the engine's folder alone once for the writes that read it, and again once a file of it is written". Base: 4 failed; after: "13 passed".

## Edits to existing tests, allow lists and tags

- tests/routes/edit/config-key.test.ts: removed `// @module-tag slow: every case takes 140 ms or more to write a setting through the route.` (item 24).
- tests/routes/edit/config-value.test.ts: removed `// @module-tag slow: every case takes 240 ms or more to write a list through the route.` (item 24).
- tests/server/edit/config-value.test.ts: 'adds one item, removes one and swaps two, and keeps every other line' lost `{ tags: ['slow'] }`, and the head lines saying it was tagged slow; its assertions are unchanged, only re-indented (item 24).
- tests/server/git/git-scan-depth.test.ts: describe 'the top folder and the workspace mark of each root' gained `{ tags: ['slow'] }`, as it runs real git (item 24).
- tests/checks/source/keys.test.ts: the status letters gained `'T'` (before `['M', 'A', 'D', 'R', 'C', '?', ...]`, after `['M', 'A', 'D', 'R', 'C', 'T', '?', ...]`, item 2); each file's code is parsed once (`codeOf`) in place of once per check (item 24).
- tests/checks/source/comment-width.test.ts: a file is parsed only when it holds a line past the width (item 24); its assertion is unchanged.
- tests/server/machine/pty/channel.test.ts: the fake driver gained `read`; it answers the `display-message` format it is asked (`answerWith(format, values)`), where it formatted `cursorArgs(SESSION)` imported from capture.ts; the two existing cases pass the pane's values (before `driver({ answer })` with `answer = answerWith({...})`, after `driver({ values })`), their expectations unchanged. On base with the new file, those cases pass ("Tests 2 failed | 13 passed (15)", the two failures being the new G35 rows).
- tests/server/root/context-fixture.ts and tests/server/machine/apps/tools/terminals/terminals-page.test.ts: their idle drivers gained `read` and are now one `idleDriver()` in tests/fixtures/doubles.ts.
- No allow list changed (`utils/size-allow.txt` and the boundary and duplication lists are as on base).

## The looks (item 43)

The orchestrator takes these on the TEST page at landing.

1. Repositories, a repository with one conflict in a merge: the merge editor reads "1 conflict left", Complete Merge asks "1 conflict is still open. Complete the merge anyway?"; with two: "2 conflicts left", "2 conflicts are still open". One change: the list's count title "1 change".
2. A scratch repository with a tracked file replaced by a symlink, unstaged then staged: the row reads "type changed" with T in the modified colour; the diff shows one file with its two sides named; no Stage Block or Revert Block; Stage and Discard act on the path.
3. Merge editor at 110 px and 600 px: the choices are small links above each conflict, parted by bars, wrapping, none overlapping; hover underlines one in the link colour.
4. Change Icon under each theme: each row is the glyph then its words, the same gap; a key with no words shows them with spaces.
5. Map in link mode: write a link, remove it, remove a node, resize the pane: no other node moves; add a project: only it is placed.
6. Map with labels near edges and the right side: no label across an edge, none cut, no node on a wall.
7. Map in a tall pane and a wide pane: no empty band.
8. Proof run: the twenty greps of item 8.
9. References view toolbar popover opened and closed ten times: no console error.
10. Terminal tab at 400, 200 and 100 px: the list narrows, then hides; with it hidden, the bar's terminals menu lists the tab's terminals; no row name cut to one letter.
11. Repositories change rows at 189 px: names whole or cut at the end, no room for hidden actions.
12. Two saves of a .tex file before the settings arrive: one build with auto-build on, none with it off.
13. A Confirm and ScheduleDialog over a view with a PDF tab open: the page visible behind the half-black scrim; both dialogs in the theme's colours.
14. A code theme whose file fails, picked twice, then loadable and picked again: repaints on the third pick, no error.
15. Session, Transcript and Timeline tabs pinning nothing, and Files in follow mode: reload; each shows what it showed; with the session or file gone, the empty state.
16. A Terminal tab with a running terminal across ten layout writes and a reload, and a reload before the terminal channel answers: the tab stays.
17. Proof run: case 17's runs (item 17's row).
18. A PNG with eXIf past chunk 512 and a late-orientation JPEG in a card or note: both turned.
19. Files view retry control: "Read again".
20. Workspace picker with a/x, b/x, a folder named hub and two hubs of one name: all labels differ; arm Kill with the pointer and move the focus to the grid: still armed; a Split tab after its start lands: no split or worktree folder offered.
21. Help page diagrams: writes.svg reads at its own size; no label overruns its box.
22. Proof run: `awk 'length > 400' plan.md` (the orchestrator's case).
23. Merge editor with an open conflict before any choice: tinted.
24. Proof run: item 24's timings and the test:quick run over its eight files.
25. Reload a page whose rail holds buttons and open the rail editor: "The rail has no button" never shows.
26. TEST's pane with a Files tab and two others: open each from the catalogue, reload five times, switch pages: the order stays.
27. An app's tmux terminal attached for the first time, and a terminal after a reload: the screen drawn at once and whole.
28. Update tray with a task that has a run and no schedule: the date and "Next: no schedule" in separate cells.
29. A Recover whose command exits 1: the tab stays with the failure; hovering the ended terminal names its folder and "Ended with exit status 1".
30. Venues, Pillars, Domains, Data: no intro says "My" or names `registries/`; this hub's intros show from its files' `intro:`; Venues' intro has no space before its full stop.
31. Focus page at 380 px with one unplaced project: one sentence, glyph and count at its start, links at its end.
32. Sessions list with a `claude -p` session: its prompt and a title shown.
33. Two hubs' session groups each read their hub's name; two same-titled projects of two hubs told apart in Pin.
34. Right-click a folder in Files: Make Folder a Hub and Make Folder a Project in the menu as it opens, no request at the press (network panel); make a project of a folder, then open that folder's menu again: neither Make entry shown, with no request; make a hub of a folder, then open the menu of a folder below it: Make Folder a Hub gone, Make Folder a Project still there.
35. A view that throws (on the scratch hub if one does): its tab shows the message and Draw again; another tab of the pane draws normally.
36. Pillar 3's card: the formula drawn; a text with two `$` prices stays text; an invalid formula shows as text and the card draws.
37. A page with only a Transcript tab: a session card's pick opens the session in it; with both a Transcript and a session-detail tab: the tab used last.
38. Arm Kill, press inside an app frame: disarmed; press inside a PDF preview: disarmed.
39. A card at rest and the Usage view's card: no room for hidden controls; hover shows them.
40. Proof run: case 40's grep and diff.
