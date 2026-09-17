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
