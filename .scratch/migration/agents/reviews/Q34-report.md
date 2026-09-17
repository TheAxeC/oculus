# Step Q34 builder report

Everything in the brief is done. Three of the new files sit outside the path list in decision 5, and several choices you can see on screen need your ruling (listed under "Decisions to confirm"). None of the files the mid-task path rule named was edited: `state/focus.ts`, `Lanes.svelte`, `Band.svelte`, `LaneHead.svelte`, `state/tones.ts`, `config/vocab.yml`.

Worktree: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q34/tools/oculus`. Scratch: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q34-builder/`, called SCR below. Screenshots before the change are in `SCR/shots/` and after in `SCR/shots-after/`.

## DONE / NOT DONE

All commands were run from tools/oculus in the worktree.

| Item | State | Proof |
|---|---|---|
| 1 Actions on hover, More menu | DONE | `cards.spec.ts` tests 1 to 3 |
| 2 One Filter control | DONE | `cards.spec.ts` test 4, `board-filter-menu.test.ts`, `projects.test.ts` |
| 3 Long text clamp | DONE | `cards.spec.ts` test 5, `projects.test.ts`, `collection.test.ts`, `card-layout.test.ts` |
| 4 No voids | DONE | `cards.spec.ts` test 6 |
| 5 Subtasks | DONE | `projects.test.ts`, `project.test.ts`, `collection.test.ts`, `collection.spec.ts` |
| 6 Map labels | DONE | `cards.spec.ts` test 10, `map-labels.test.ts` |
| 7 Lit Watch source line | DONE | `cards.spec.ts` test 8 |
| 8 Memories placeholder | DONE | `cards.spec.ts` test 9 |
| 9 Documents once | DONE | `cards.spec.ts` test 7, `project.test.ts` |
| 10 Editor help | DONE | screenshot `SCR/shots-after/editor.png`; the YAML still parses with 25 `help:` entries, the same count as before |

Verification output:
- `npx vitest run --reporter=dot`: `Test Files 240 passed (240)`, `Tests 4011 passed (4011)`. No timing test needed a rerun.
- `npm run check`: `COMPLETED 1188 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0.
- `npm run format:check`: "All matched files use Prettier code style!"
- `npm run lint`: exit 0, no problems.
- ASCII gate (the perl command from the brief): prints nothing.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: largest files are `970 tests/state/layout.test.ts` and `986 tests/state/board.test.ts`.
- `npx playwright test tests/browser/cards.spec.ts board.spec.ts focus-buttons.spec.ts collection.spec.ts unsaved-forms.spec.ts`: `35 passed (53.1s)`.
- Extra run over `memories`, `map`, `keyboard`, `layout`, `shell-defects`, `tasks`, `rail`, `views`, `leads` and `funding` specs: `58 passed (1.1m)`.
- No existing browser spec needed changing. `collection.spec.ts` presses "+ subtask" by its accessible name, which is now the card's own control, and it passes.

## Defects: as reproduced, and as fixed

The "before" probe is `SCR/probe/before.spec.ts` and `before2.spec.ts`, run on the unchanged build. The "after" numbers come from the same probe on the final build.

- **Actions:** Command centre rows carried up to 7 visible chips (`shots/focus.png`). Project card meta rows wrapped the icons (meta heights `[20,45,45,...]`). Now controls show only on hover or focus (`shots-after/focus-rest.png`, `focus-hover.png`, `narrow.png`). Every strip is one line, and what does not fit goes behind a More opener.
- **Filter:** 11 filter menus (`filter menus 11`, `shots/projects.png`). Now there are 0, and one "Filter" control opens a list grouped by facet (`shots-after/filter-menu.png`).
- **Long text:** a card with a long ELI5 was 943px tall against neighbours of 305 to 375px. Now it is cut to four lines with a "Show more" control (`shots-after/projects.png`).
- **Voids:** short cards in a row left empty space under them. Now every card in a row has the same bottom.
- **Subtasks:** 3 subtasks blocks on 3 event cards, each reading "SUBTASKS 0 open" (`shots/events.png`). Now 0 blocks.
- **Map:** after writing 8 crowded projects into the hub copy, `crowded labels 19 overlapping visible pairs 1` (`shots/map-crowded.png`). Now 0 pairs.
- **Lit Watch:** with a long author list and venue, the line measured 628 wide in a 329 box and was clipped (`shots/radar.png`). It now ends in an ellipsis inside the card, with the whole line as its tooltip.
- **Memories:** tiles were `[238,2]` while the photo loaded, then 189 and 366 tall once loaded. Now `[238,179]` both while loading and after.
- **Project view:** 2 Documents headings (`shots/project.png`). Now 1.
- **Editor:** help read "the folder name - rename = a folder move, not a form edit" (`shots/editor.png`). It now reads "The project's folder name. Set by the folder the project is in; rename the folder to change it."

## What changed

- **Actions:** a new component, `views/shared/CardActions.svelte`, measures the room and uses `fitActions` and `actionRoom` from `card-layout.ts`. Controls are transparent until `.card:hover` or `:focus-within`, and always drawn on devices without hover. The project card and entry card both use it.
- **Ticker rows:** hover CSS is in `CommandCenterView.svelte` and `Tasks.svelte`. A row whose first button is its done tick gets an id ending in `TICKED` (`':done'`, from `focus/rows.ts`), which keeps the tick drawn.
- **Filter:** `ui/Menu.svelte` gains `groups?: MenuGroup[]`, with headings drawn as `role="group"`; a pick now passes the group id as a third argument. The groups and the count come from `state/board/filter-menu.ts`. The opener reads "Filter", or "Filter (n)" while n values are in force.
- **Clamp:** a new `views/shared/Clamp.svelte` cuts text to four lines and measures scroll height against line height. Its open state is `more: Id[]` in the board state and in the collection state.
- **Grids:** `align-items: stretch` with slot and card flex, in `Projects.svelte`, `Collection.svelte`, `ProjectCard.svelte` and `EntryCard.svelte`.
- **Subtasks:** `Subtasks.svelte` takes `adding` and `onadding` and draws nothing when there are no lines. `ProjectCard` draws the block itself, no longer inside `CardDetails`.
- **Map:** a new `views/map/labels.ts` (`labelBox`, `shownLabels`). `Graph.svelte` measures each label with `getBBox` and draws all labels in one layer, with the hovered and selected labels last.
- **Documents:** `ProjectCard` takes a `documents` prop, passed through `CardDetails` to `CardDocs`. `Project.svelte` passes `documents={false}`.

## Tests and the revert run for each

Every revert below was applied, the test run, and the original restored. The restore was checked by `cmp`, or for the browser batches by `diff -r` against a tar of `src` taken first.

Node tests (`SCR/reverts/node.py`), all turned red:
- `board-filter-menu.test.ts` "ticks the values in force": revert drops the tick glyph.
- `board-filter-menu.test.ts` "counts every value in force": revert makes the label ignore the count.
- `board.test.ts` "keeps which cards draw their long description whole": revert stops parsing `more`.
- `collection.test.ts` (state) "keeps which entries draw their long text whole": revert stops parsing `more`.
- `projects.test.ts`:
  - "offers one filter control...": revert is HEAD's `Projects.svelte`.
  - "counts the values in force on the control": revert is `filterLabel({})`.
  - "is cut to its clamp...": revert is `more={false}`.
  - "draws no subtasks block, open or closed": revert is `{#if true}` in `Subtasks`.
  - "offers adding the first subtask...": revert removes the action.
- `project.test.ts`:
  - "draws the documents once": revert is `documents={true}`.
  - "draws no subtasks block for a project with none": revert is `{#if true}`.
- `collection.test.ts` (views):
  - "...entry with none...": revert removes the action.
  - "...entry that has subtasks...": revert is `{#if adding}`.
  - "cuts a long body...": revert is `open={false}`.
- `card-layout.test.ts`:
  - More taking no room: revert is `left = room`.
  - Clamp threshold: revert is `- 1` instead of `+ 1`.
  - The clamp control ignoring whether the text fits.
  - `actionRoom` always returning the whole line.
- `map-labels.test.ts`:
  - Overlap check removed.
  - Hovered and selected labels no longer drawn first.
- `focus-rows.test.ts`: revert is `ticked = false`.

Browser tests (`SCR/reverts/browser.py`), all 10 turned red, each on its own assertion:
- Test 1: controls at `opacity: 1`, red at line 55.
- Test 2: ticker buttons at `opacity: 1`, red at line 93. The tick rule removed, red at line 86.
- Test 3: `fitActions` always returns all, red at "more toBeAttached".
- Test 4: Menu without `groups`, red at the group heading.
- Test 5: clamp state local to the component, red at "Show less" after the tab switch.
- Test 6: `align-items: start`, red at bottoms equal.
- Test 7: `documents={false}` removed, red at `toHaveCount(1)`.
- Test 8: no ellipsis or nowrap, red with "clip" instead of "ellipsis".
- Test 9: `aspect-ratio` removed, red at size equal after load.
- Test 10: labels never hidden, red at 6 overlapping pairs.

Audits updated to match: `type-scale.test.ts` (new entries plus Menu's `.heading`) and `card-docs.test.ts` (the `documents` prop).

## Paths outside decision 5

- `src/lib/views/shared/Clamp.svelte`, `CardActions.svelte` and `card-layout.ts` are new files. They are shared by `ProjectCard` and `EntryCard`, and the layer rules allow shared blocks only under `views/shared/`. They are new names, so they cannot collide with another step.
- `src/lib/state/board/filter-menu.ts` is new, under the state modules the board reads.

## Decisions to confirm (each reversible)

1. **Memories tiles are now fixed 4:3 boxes with the photo cropped to fill them** (`object-fit: cover`). The server sends picture names without sizes, so this is the only way to have no layout shift within the allowed paths. The wall used to keep each picture's own proportions. Over a wallpaper, the placeholder uses the pane's tint (`background: transparent`, required by `tinted.test.ts`).
2. **Card controls now sit at the right end of the meta row.** When the chips leave too little room, the row moves under them, as on Graph-Transfer.
3. **More is a chevron opener that is 24px tall, against 20px for the other controls.** It shows on wide cards too when the chips are wide; at 1600px, "edit manifest" on the first card is behind More.
4. **The card no longer clips its content** (`.slot > :global(.card) { overflow: visible }`). This lets the More list show past a short card. The colour bar gets a matching left border radius.
5. **The project tab loses the card's document row,** including the tags for absent documents (TEX, PDF) and the human-only marker. Its own section lists only present Markdown.
6. **The Filter control's accessible name includes its count** ("Filter (3)").

## Limitations

- The done-tick selector repeats `':done'` as a CSS literal in two views, beside `TICKED` in `rows.ts`.
- Hover reveal matches any ancestor with the class `.card`.
- Ticker controls that are hidden still take their layout space, per decision 1, so long row names stay truncated.
- Map label boxes are measured again only when the node set or a label changes. A text-scale change keeps the old boxes until then.
- Clamp and More are decided in the browser. A server rendering draws no Show more control and every control inline.
- Radar and Leads grids are not stretched, and Radar notes are not clamped; the brief names boards and collections.

## Doc text (not edited, per decision 4)

HELP.md, `projects` row: append "Each card's controls appear under the pointer or the keyboard and stay on one line, the ones that do not fit behind More; one Filter control in the toolbar holds every facet under its heading, ticks the values in force and counts them on its button; a long ELI5 is cut to four lines with Show more, which the tab remembers; a card with no subtasks offers adding the first among its controls."

HELP.md, `focus` row: append "A ticker line's buttons appear under the pointer or the keyboard; a line's done tick is always shown."

HELP.md, `map` row: append "A label that would cover another is hidden until its node is hovered or holds the keyboard."

HELP.md, `radar` row: append "A long author and venue line ends in an ellipsis, the whole line in its tooltip."

HELP.md, `memories` row: replace with "The photo wall, each picture in a tile of one shape, a muted tile while it loads and its name when it fails, with a control that adds a picture and a click that enlarges one."

DESIGN.md, Decisions taken: add "The boards and collection cards. A card's controls are `views/shared/CardActions.svelte`: drawn under the pointer or keyboard focus, transparent otherwise so nothing moves and Tab reaches them, kept on one line with the ones that do not fit in one More menu, the room measured beside the card's chips. A long description is `views/shared/Clamp.svelte`, four lines, its open state `more` in the view instance's state. The board's facets are one `ui/Menu` whose `groups` draw a heading per facet (`state/board/filter-menu.ts`). Card grids stretch each row's cards to one height in file order. A card draws no subtasks block until it has a subtask, adding the first being a card control. The project tab draws its documents once, the card's list left out through `ProjectCard`'s `documents`. The Map hides a label overlapping one drawn before it (`views/map/labels.ts`), the hovered and selected labels drawn last. The Memories wall draws every tile as one 4:3 box the picture is fitted into."

## Files changed (lines now)

New:
- `src/lib/state/board/filter-menu.ts` 133
- `src/lib/views/map/labels.ts` 60
- `src/lib/views/shared/CardActions.svelte` 160
- `src/lib/views/shared/Clamp.svelte` 88
- `src/lib/views/shared/card-layout.ts` 60
- `tests/browser/cards.spec.ts` 450
- `tests/state/board-filter-menu.test.ts` 123
- `tests/views/card-layout.test.ts` 83
- `tests/views/focus-rows.test.ts` 56
- `tests/views/map-labels.test.ts` 71

Modified (`git diff --stat`: 29 files, +882 / -377):
- `ui/Menu.svelte` 530
- `views/map/Graph.svelte` 532
- `views/shared/ProjectCard.svelte` 456
- `views/collection/EntryCard.svelte` 469
- `views/Projects.svelte` 369
- `Subtasks.svelte`, `CardDetails.svelte`, `CardDocs.svelte`, `Project.svelte`, `Collection.svelte`, `Memories.svelte`, `RadarCard.svelte`
- `focus/CommandCenterView.svelte`, `focus/Tasks.svelte`, `focus/rows.ts`
- `state/board/index.ts`, `presets.ts`, `state.ts`, `state/collection.ts`
- `config/manifest-schema.yml` (help values only), `config/text/views/project.yml`, `projects.yml`
- Tests: `board.test.ts` 986, `collection.test.ts` (state and views), `card-docs.test.ts`, `project.test.ts`, `projects.test.ts`, `type-scale.test.ts`

Grep for the removed names (`filter_by|Filter by|facet menu|menu per facet|keeps its own proportions`) over src, tests, config, HELP.md, DESIGN.md and README.md: the remaining hits are `history.yml`'s own "Filter by file, key or field" (unrelated) and the new tests that assert no menu per facet.


Everything in the brief and all eleven repair rulings are done. None of the six files the orchestrator reserved for another step (`state/focus.ts`, `views/focus/Lanes.svelte`, `Band.svelte`, `LaneHead.svelte`, `state/tones.ts`, `config/vocab.yml`) was edited.

Worktree: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q34/tools/oculus`. Scratch folder: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q34-builder/`, called SCR below. Screenshots from before the fix are in `SCR/shots/`, from the first round in `SCR/shots-after/`, and from this repair round in `SCR/shots-repair/`.

## DONE / NOT DONE (end state, after the repair)

| Item | State | Proof |
|---|---|---|
| 1 Controls shown on hover, More menu | DONE | `cards.spec.ts`: "a card's controls...", "a ticker row's buttons...", "a card meta row is one line...", "what does not fit is behind More...", "in a pane narrower than its cards..." |
| 2 One Filter control | DONE | `cards.spec.ts` "the one Filter control...", `board-filter-menu.test.ts`, `projects.test.ts` |
| 3 Long text clamped | DONE | `cards.spec.ts` "a long description...", `board-more.test.ts`, `projects.test.ts`, `collection.test.ts`, `card-layout.test.ts` |
| 4 No gaps in the grid | DONE | `cards.spec.ts` "the cards of one grid row start at one top and end at one bottom" |
| 5 Subtasks block | DONE | `projects.test.ts`, `project.test.ts`, `collection.test.ts`, `collection.spec.ts` |
| 6 Map labels | DONE | `cards.spec.ts` Map case, `map-labels.test.ts`, `map.test.ts` "dims an archived..." |
| 7 Lit Watch source line | DONE | `cards.spec.ts` Lit Watch case |
| 8 Memories placeholder | DONE | `cards.spec.ts` Memories case |
| 9 Documents listed once | DONE | `cards.spec.ts` "the project view draws one Documents heading", `project.test.ts` |
| 10 Editor help text | DONE | `SCR/shots-after/editor.png`; the YAML still has 25 `help:` values |

### Verify list, rerun after the repair (from tools/oculus)
- `npx vitest run --reporter=dot`: `Test Files 241 passed (241)`, `Tests 4021 passed (4021)`. No timing test needed a rerun.
- `npm run check`: `COMPLETED 1190 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0.
- `npm run format:check`: "All matched files use Prettier code style!"
- `npm run lint`: exit 0.
- ASCII gate (the perl command): prints nothing, 0 lines.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `980 tests/state/board.test.ts`.
- Browser, required set: `npx playwright test tests/browser/cards.spec.ts board.spec.ts focus-buttons.spec.ts collection.spec.ts unsaved-forms.spec.ts` gives `38 passed (1.1m)`.
- Browser, extra run over `memories`, `map`, `keyboard`, `layout`, `shell-defects`, `tasks`, `rail`, `views`, `leads`, `funding`, `focus-look` and `appearance`: `63 passed (1.4m)`.

## Repair round

### Rulings

1. **DONE: the button a ticker row exists for stays visible, with the rule written once.**
   - `ui/Ticker.svelte` has two new props, `reveal?: boolean` and `kept?: (row) => string | undefined`. It owns the hover and focus reveal, and a device without hover shows every button. `kept` also works on a plain row, which is a row whose name is not a link.
   - The copied `:global` CSS blocks, `TICKED` and the `':done'` literal are gone from `Tasks.svelte`, `CommandCenterView.svelte` and `rows.ts`.
   - `rows.ts` has `keptAction(actions, config)`: a row's `done`, or else its first status that the palette marks `terminal` (a task's `done`, an event's `completed`). `rowMaker(prefix, config)` returns `kept`.
   - Browser proof: a task entry row keeps `done` at opacity 1 while its other buttons are at 0, in `section.week` (the Command centre's dated task) and in `section.tasks` (the undated task). A follow-up row that opens nothing keeps its done too.
   - Screenshot: `SCR/shots-repair/focus-tasks-rest.png` shows DONE on the task row and on the follow-up row with the pointer away.
   - Node test: `focus-rows.test.ts`.
2. **DONE: meta row is one line whenever the chips and controls fit.**
   - `CardActions.svelte` now measures with `getBoundingClientRect` (fractional widths).
   - `card-layout.ts` `actionPlace` keeps the strip beside the chips only when `beside >= least + SLACK` (`SLACK = 1`); `leastStrip` is either every control, or the first control plus More.
   - Browser case "a card meta row is one line..." resizes to 1600, 1601 and 820. It waits until two reads agree, then checks every card's `.meta` height against its tallest child.
   - A probe (`SCR/probe/sweep.spec.ts`) swept every width from 700 to 1900 on this build and found `BANDS 0`. With the room overestimated by 4px it found `BANDS 594`, including 820.
   - Screenshot: `SCR/shots-repair/projects-1600-hover.png` shows Graph-Transfer's row on one line with More.
3. **DONE: controls stay reachable in a narrow pane.**
   - The room is the part of the line that is actually visible: the smallest right edge of the ancestors that clip it (`visibleRight`). The resize observer also watches those ancestors.
   - When the strip sits on its own line, or the card is clipped, `.actions.start` drops the left auto margin, so the strip starts at the line's start.
   - Browser case: at 700 wide with the editor beside the board, it first confirms the first card is wider than the pane. It then scrolls down to each card with `scrollLeft` held at 0, hovers the title, and checks every control and More: inside the pane, and `elementFromPoint` hits it.
   - Screenshot: `SCR/shots-repair/narrow-700-hover.png`.
4. **DONE: More matches the other controls' height.** `[data-action-more] :global(.opener)` gets the compact ToolButton's padding, `--fs-sm` font size and colours. The browser case asserts More's height is within 0.5px of a compact control. The type-scale and wallpaper audits name the new rule.
5. **DONE: Lit Watch shrinks with the pane.**
   - `Radar.svelte`: `.radar { grid-template-columns: minmax(0, 1fr) }`, and `min-width: 0` on the grid items. `Bucket.svelte`: `min-width: 0` on the card grid items.
   - Browser case: at 700 wide with a long source line, the pane body's `scrollWidth - clientWidth` is 0 and the line ends inside its card.
   - The head comment of `RadarCard.svelte` now says the line is cut with an ellipsis and the whole text is its tooltip.
   - Screenshot: `SCR/shots-repair/radar-700.png`.
6. **DONE: archived labels are dimmed again.** In `Graph.svelte` the label gets `class:archived`, and `text.archived { opacity: 0.6 }`. `map.test.ts` has a case "dims an archived node's label...". A probe (`SCR/maparch.log`) shows Early-Bench, Quant-NoGo and Spectral Collab at 0.6 and the rest at 1. Screenshot: `SCR/shots-repair/map-archived.png`.
7. **DONE: Memories pictures are no longer cropped.** The tile keeps its 4:3 box with `object-fit: contain`. The browser case asserts `contain` and the same tile size before and after the picture loads. Screenshot: `SCR/shots-repair/memories.png`, where documents and a phone screenshot show whole. Sending each picture's own size from the server is booked as a later step and was not built.
8. **DONE: long titles and folders stay inside the card.** The card still draws past its own edge. `.slot > :global(.card .title) { overflow-wrap: anywhere }` is set in `ProjectCard` and `EntryCard`. A browser case writes a project with a long unbroken folder name and short handle, and checks that the title text, heading and folder right edges are at or inside the card's right edge.
9. **DONE:** kept as ruled. The Doc text below says the project tab lists present Markdown only.
10. **DONE: proof gaps closed.**
    - The grid case now takes the column count from the distinct left edges and compares top and bottom edges (within 0.5px) row by row, in file order.
    - The `more` parse test moved to `tests/state/board-more.test.ts`. It covers empty, duplicated, non-string and colliding with `expanded`. `board.test.ts` is at 980 lines.
    - Late measurements: `card-layout.ts` `measureGate()` (`begin`, `current`, `close`) guards the tick and the observers in `CardActions` and `Clamp`. `card-layout.test.ts` covers a measurement that lands while it is still the latest, after a newer one began, after close, and after a new run starts.
11. **DONE: standards.**
    - The two "now that the card does not clip it" comments are rewritten.
    - `projects.test.ts` names `tests/state/board-filter-menu.test.ts`.
    - The tick glyph comes through the catalog as `board.filter_tick_glyph: check`.
    - Comment paragraphs I wrote that ran past 100 columns are rewrapped; comments I did not write are left as they were.
    - The focus-row Doc text is updated below.

### Reverts run (each applied, run, restored)
Node reverts (`SCR/reverts/node2.py`), all red:
- K1: `keptAction` drops the terminal-status branch. Red: "is a task entry's done and an event's completed...".
- K2: `kept` returns undefined. Red: "is a subtask's and a follow-up's done...".
- G1: the gate ignores `close`. Red: "is dropped once the component has closed...".
- G2: the gate ignores newer tokens. Red: "is dropped once a newer one has begun".
- P1: no slack. Red: "stays beside the chips, less the slack...".
- L1: `leastStrip` returns every control. Red: "needs every control...".
- A1: the archived marker removed from the label only. Red: "dims an archived node's label...".
- M1: `more` not parsed. Red: "keeps the ids it wrote...".
- M2: `more` merged with `expanded`. Red: "keeps an id that is also an open card apart...".

Browser reverts (`SCR/reverts/browser2.py`, each with a fresh build, restore confirmed and `src` diffed against a tar taken first), all red:
- BR1: the kept rule removed from Ticker. Red at `cards.spec.ts:111`.
- BR2b: room overestimated (`SLACK = -4`). Red at `:191`, the meta row case.
- BR3: no visible-edge bound and no start placement. Red at `:299`, the narrow pane case.
- BR4: More padding removed. Red at `:189`.
- BR5: the Radar and Bucket column and `min-width` rules removed. Red at `:502`.
- BR6: `object-fit: cover`. Red at `:555`.
- BR7: title not breaking. Red at `:436`.

### Checks that could not catch their defect (not repaired, cases changed instead)
- BR2 as first written (integer `offsetWidth` widths plus `SLACK = 0`) left the meta row case green, and the 700 to 1900 sweep found no gap row on that build either. So on this build an integer measurement alone makes no gap row in the demo hub. BR2b, a room claimed 4px too wide, is the revert that shows the case detects one.
- BR3 left the narrow pane case green while that case let Playwright scroll the pane sideways to reach each control. The case was changed to hold `scrollLeft` at 0 and point with the mouse, and BR3 then turned it red.

## Decisions to confirm (reversible)
- **The kept button of an entry row is its first terminal status in the collection's own order.** Tasks get `done` (before `dropped`); events get `completed` (before `cancelled`). Which statuses count as terminal is read from `status_palette` through `state/focus.ts` `terminal` (imported, not edited).
- **When a card is clipped by a narrow pane, its strip sits right after the chips** rather than at the card's end, which is off-screen.

## Limitations
- The More opener's size is set from `CardActions` through `:global(.opener)`, which reaches into `ui/Menu.svelte`'s markup. The ruling asked for this height, and `Menu.svelte` may only be edited for group headings.
- The meta row and narrow pane cases run on the demo hub only. A hub with wider chips was not measured.
- Horizontal scrolling of a clipped pane does not trigger a remeasure. The room is re-read on resize, not on scroll.
- The Memories alt text stays shown for a picture that failed and is later replaced under the same name, until the view is reopened.

## Doc text (HELP.md and DESIGN.md are not edited)

HELP.md, `projects` row, append: "Each card's controls appear under the pointer or the keyboard and stay on one line, the ones that do not fit behind More at the controls' own size, and in a pane narrower than the card they stay inside what the pane shows; one Filter control in the toolbar holds every facet under its heading, ticks the values in force and counts them on its button; a long ELI5 is cut to four lines with Show more, which the tab remembers; a card with no subtasks offers adding the first among its controls."

HELP.md, `focus` row, append: "A ticker line's buttons appear under the pointer or the keyboard; the one the line exists for is always shown: a subtask's or a follow-up's done, and an entry's first closing status, such as a task's done."

HELP.md, `map` row, append: "A label that would cover another is hidden until its node is hovered or holds the keyboard, and an archived project's label is dimmed with its node."

HELP.md, `radar` row, append: "A long author and venue line is cut with an ellipsis, the whole line in its tooltip, and the cards narrow with the pane."

HELP.md, `memories` row, replace with: "The photo wall, each picture shown whole in a tile of one shape, a muted tile while it loads and its name when it fails, with a control that adds a picture and a click that enlarges one."

HELP.md, project tab sentence (line 120), append to `project`: "whose card leaves out the document row, the tab listing the project's present Markdown documents only, so the absent-document tags and the human-only marker are not shown there".

DESIGN.md, Decisions taken, add: "The boards and collection cards. A card's controls are `views/shared/CardActions.svelte`: drawn under the pointer or keyboard focus, transparent otherwise so nothing moves and Tab reaches them, kept on one line with the ones that do not fit in one More menu drawn at the controls' height. The room is measured in fractional widths within the part of the card the pane shows, beside the chips when the narrowest useful strip fits there and on a line of its own from the line's start otherwise (`card-layout.ts`), and a measurement landing after a newer one or after the component is gone is dropped. A ticker row's buttons are revealed the same way by `ui/Ticker.svelte`'s `reveal`, the button the row exists for (`kept`: a done, or an entry's first terminal status) always drawn. A long description is `views/shared/Clamp.svelte`, four lines, its open state `more` in the view instance's state. The board's facets are one `ui/Menu` whose `groups` draw a heading per facet (`state/board/filter-menu.ts`). Card grids stretch each row's cards to one height in file order, and a card breaks a long unbroken title inside its width. A card draws no subtasks block until it has a subtask, adding the first being a card control. The project tab draws its documents once, present Markdown only, the card's list left out through `ProjectCard`'s `documents`. The Map hides a label overlapping one drawn before it (`views/map/labels.ts`), the hovered and selected labels drawn last and an archived node's label dimmed. Lit Watch's grid is one column of `minmax(0, 1fr)`, so a long line never widens the pane. The Memories wall draws every tile as one 4:3 box with the whole picture fitted inside; carrying each picture's size so a tile takes the picture's proportions is a later step."

## Files changed (35 modified, 11 new; `git diff --stat`: +990 / -397 over tracked files)

New:
- `src/lib/state/board/filter-menu.ts`
- `src/lib/views/map/labels.ts` 60
- `src/lib/views/shared/CardActions.svelte` 217
- `src/lib/views/shared/Clamp.svelte`
- `src/lib/views/shared/card-layout.ts` 108
- `tests/browser/cards.spec.ts` 664
- `tests/state/board-filter-menu.test.ts`
- `tests/state/board-more.test.ts` 41
- `tests/views/card-layout.test.ts` 119
- `tests/views/focus-rows.test.ts` 79
- `tests/views/map-labels.test.ts`

Modified in this round:
- `src/lib/ui/Ticker.svelte` 189
- `src/lib/views/focus/rows.ts` 250, `focus/CommandCenter.svelte`, `focus/CommandCenterView.svelte`, `focus/Tasks.svelte`
- `src/lib/views/Radar.svelte`, `radar/Bucket.svelte`, `radar/RadarCard.svelte`
- `src/lib/views/map/Graph.svelte` 538
- `src/lib/views/Memories.svelte`, `shared/ProjectCard.svelte`, `collection/EntryCard.svelte`, `Projects.svelte`
- `state/board/filter-menu.ts`, `config/text/views/projects.yml`
- `tests/state/board.test.ts` 980, `tests/views/map.test.ts` 438, `projects.test.ts`, `type-scale.test.ts`, `tests/ui/wall.test.ts`

Modified in round one and unchanged here:
- `config/manifest-schema.yml` (help values only), `config/text/views/project.yml`
- `state/board/index.ts`, `presets.ts`, `state.ts`, `state/collection.ts`
- `ui/Menu.svelte`, `Collection.svelte`, `Project.svelte`
- `shared/CardDetails.svelte`, `CardDocs.svelte`, `Subtasks.svelte`
- `tests/state/collection.test.ts`, `tests/views/card-docs.test.ts`, `collection.test.ts`, `project.test.ts`
