# Step Q34 refuter report (on .agents/worktrees/q34, base 22ef9103)

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree unless a clone is named.

- `npx vitest run --reporter=dot`: `Test Files 240 passed (240)`, `Tests 4011 passed (4011)`. No timing test timed out, so none was rerun.
- `npm run check`: `COMPLETED 1189 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. The builder reported 1188 files.
- `npm run lint`: exit 0.
- `npm run format:check`: "All matched files use Prettier code style!"
- ASCII gate (the perl command): prints nothing.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `986 tests/state/board.test.ts`.
- `npm run build`: exit 0.
- `npx playwright test tests/browser/cards.spec.ts tests/browser/board.spec.ts tests/browser/focus-buttons.spec.ts tests/browser/collection.spec.ts tests/browser/unsaved-forms.spec.ts`: `35 passed (55.4s)`.
- `git status --short` lists 29 modified and 10 untracked files. None of `state/focus.ts`, `views/focus/Lanes.svelte`, `Band.svelte`, `LaneHead.svelte`, `state/tones.ts` or `config/vocab.yml` is among them.
- Clones for probes and reverts, all under `scratchpad/q34-review/`:
  - `after/`: a copy of the worktree's `tools/oculus`.
  - `base/`: the same copy with `git diff 22ef9103` applied in reverse and the 10 new files removed.
  - `node/`: a copy used for the node reverts.
  - Both `after/` and `base/` were built. Screenshots are in `shots-base/` and `shots-after/` (light and dark themes, 1600 and 700 wide) and in `meas-*`. Probes are `probe*/`. Logs are `meas-*.log`, `narrow-*.log`, `band.log` and `reverts/`.

## 1. Spec

- **Item 1 is not done for task rows** (`src/lib/views/focus/rows.ts:136-137`, `Tasks.svelte:152-160`, `CommandCenterView.svelte:275-283`).
  - The brief says the one control a row exists for, "a task's done tick", stays visible. Only rows whose first action id is `done` (an open subtask or a follow-up) keep a visible button.
  - A task entry row keeps no visible button. Probe `meas-after2.log`, ticker rows: "Update the lab wiki onboarding page doing:0 done:0 dropped:0 ..." (id `t1`) and the Command centre row "Renew compute allocation task ... doing:0 done:0". On base both read `done:1` (`meas-base.log`).
  - In both views, a task's done status is hidden until hover.
- **Item 1: the icon row still wraps to a second meta line on some cards, now as an empty band** (`src/lib/views/shared/CardActions.svelte:58,61,69,75`).
  - The room is computed from integer `offsetWidth` values with no allowance for fractional widths.
  - `band.log` at 1600 wide: Graph-Transfer's meta is 331 wide, its chips 48+35+72, its strip 157. The meta is 50px tall with the strip 26px down; at 1601 wide it is 24px tall with the strip at 0.
  - While the strip is hidden, the second line shows as a blank band under the chips (`shots-after/light-1600-projects.png`, Graph-Transfer card).
- **Item 7: the source line no longer overflows its card, but the Lit Watch grid now overflows the pane** (`src/lib/views/radar/RadarCard.svelte:179-185`, `white-space: nowrap` inside the implicit-width grid `Radar.svelte:168-171`).
  - At 700 wide with a long source line, the pane body measures `[592, 1016]` (clientWidth, scrollWidth) against `[592, 592]` on base. Cards shrink from 557 to 492 wide.
  - The intro line runs off the right edge (`meas-after.log` and `meas-base.log`, "radar 700"; `shots-after/light-700-radar.png` against `shots-base/light-700-radar.png`).
- **A change no item asks for: the Map's archived nodes lose their dimmed labels** (`src/lib/views/map/Graph.svelte:410`). The labels moved out of the node's `<g>`, so `.node.archived { opacity: 0.6 }` (`Graph.svelte:506`) no longer reaches them. With the archived toggles on, the Early-Bench, Quant-NoGo and Spectral Collab labels are at effective opacity 1 against 0.6 on base (`meas-after.log` and `meas-base.log`, "labels"). The report does not state this.
- **Files outside decision 5:** `src/lib/views/shared/CardActions.svelte`, `Clamp.svelte` and `card-layout.ts`. Decision 5 names only `ProjectCard`, `CardDetails`, `CardDocs` and `Subtasks` under `shared/`. `state/board/filter-menu.ts` falls inside "the state modules those views read". The builder's list of four matches the diff.
- **The six "Decisions to confirm", judged against the brief:**
  1. **Memories tiles cropped to 4:3** (`Memories.svelte:277,307`).
     - The brief did not name this. It asked for a placeholder "of the final size, no layout shift" and never a crop.
     - It is a user-visible shape: documents and phone screenshots become unreadable middle strips (`shots-after/light-1600-memories.png` against `shots-base/`; heights 179/179/179 against 189/366/526).
     - It is also a premise the brief's paths could not meet, since the picture's size is not in the listing.
     - Recommendation: reverse the crop. Book a step that carries each picture's width and height from the server, so the placeholder has the picture's own proportions. Until then use `object-fit: contain`.
  2. **Controls at the right end of the meta row** (`CardActions.svelte:141`).
     - Partly inside the brief, which puts More "at the line's end". The move under the chips is not named.
     - Recommendation: keep the end placement, and fix the wrap above and the narrow-pane clipping (section 4) before landing.
  3. **More opener 24px against 20px.**
     - Not named in the brief. It is user-visible: the meta row grows from 20 to 24px on every card with More (`band.log`, meta heights 24 against 20).
     - Recommendation: draw the opener at the other compact controls' height.
  4. **Card no longer clips its content** (`ProjectCard.svelte:380`, `EntryCard.svelte:390`).
     - Not named in the brief. It was added so the More list shows past a short card.
     - Recommendation: accept for this step and book a check for content wider than the card (not checked here, see Not checked).
  5. **Project tab loses the absent-document tags and the human-only marker.** Inside the brief: item 9 decides to leave `CardDocs`' list out of the tab's card, and this loss follows from it. Recommendation: keep, and state in the Doc text that presence of TEX or PDF is no longer shown on the tab.
  6. **Filter's accessible name carries the count.** Inside the brief (item 2, "a count of the values in force on the control"). Recommendation: keep.

## 2. Proof

- **Reverts rerun one at a time, each on a fresh build of `after/`, restore checked by `filecmp`** (`reverts/revert.py`, `reverts/*.log`). Every one turned red:
  - R1, `.act` opacity 1: red at `cards.spec.ts:55`.
  - R2, the done-tick rule removed from `Tasks.svelte`: red at `:86`.
  - R3, `fitActions` keeps all: red at `:128` (`more` toBeAttached).
  - R4, no `{groups}` on the Menu: red at `:184`.
  - R5, clamp state local to `Clamp.svelte`: red at `:247`.
  - R6, `align-items: start`: red at `:282`.
  - R7, `documents={false}` removed: red at `:294`.
  - R8, no ellipsis or nowrap: red at `:336`.
  - R9, no `aspect-ratio`: red at `:376`.
  - R10, overlap check removed from `labels.ts`: red at `:437`.
- **Node reverts** (`reverts/node.py`), all red:
  - N1, `{#if true}` in Subtasks: 3 tests.
  - N2, the filter label ignores the count: 2.
  - N3, `ticked = false`: 1.
  - N4, `left = room`: 2.
  - N5, leading labels not drawn first: 1.
  - N6, `documents={false}` removed: 1.
  - N7, no tick glyph: 1.
  - N8, no add-subtask action: 1.
- **`tests/browser/cards.spec.ts:299-343` does not fail for the overflow found in section 1.** It compares the line's right edge with the card's right edge. The card itself overflowing the pane passes. No test measures the grid inside the pane at a narrow width.
- **`tests/browser/cards.spec.ts:278` groups cards by their top edge and compares bottoms within a group.** Cards of one row with unequal tops would fall into separate groups and pass, so the brief's "top edges ... equal" is not checked. Bottoms are.
- **The "no action row taller than one line" test (`cards.spec.ts:98-161`) measures the strip against its tallest control.** It passes while the meta row wraps the strip onto a second line, which is the Graph-Transfer band above. It also runs only at 820 wide.
- **`tests/views/project.test.ts:211` asserts `not.toContain('>TEX</span>')`,** which encodes decision 5 as expected behaviour before it is ruled on.
- **No test exercises an empty, duplicated or colliding id** for `more` (state), a `CardAction` id or a `MenuGroup` id. Nor is the in-flight, after-close or superseded path of the `ResizeObserver` measurements in `CardActions.svelte` and `Clamp.svelte` tested, as spec.md requires.
- **Keyboard reach, verified** (`meas-after2.log`):
  - Tab from a card's title reaches pin, copy, Ask, folder, expand, slide and More, each at effective opacity 1 once focused.
  - Tab into a ticker row reaches "planned" at opacity 1.
  - Screen reader: `ariaSnapshot` with the pointer away lists every hidden control, on a card (`button "pin to top"` ... `button "More"`) and on a row (`button "planned"` ... `button "hide"`).
- **Report figures my run does not reproduce:**
  - "943px tall against neighbours of 305 to 375px": my base, with a different long ELI5, gives 543 against 322 to 375 (`shots-base.log`). The text differs, so this is not a contradiction.
  - The Map "0 pairs": on the default demo my probe found no overlapping pair on base or after, so the improvement shows only on the crowded fixture, which cards.spec R10 covers.
  - Everything else quoted matched.

## 3. Standards

- **History in comments:** `src/lib/views/shared/ProjectCard.svelte:383` and `src/lib/views/collection/EntryCard.svelte:393` say "... rounded corners now that the card does not clip it", which describes the earlier state.
- **False sentence:** `tests/views/projects.test.ts:490` says the groups are tested in "tests/state/board.test.ts over filterGroups". `filterGroups` is tested only in `tests/state/board-filter-menu.test.ts`.
- **The report's Doc text for the `focus` row, "a line's done tick is always shown", is false for task entry lines** (section 1).
- **`src/lib/views/radar/RadarCard.svelte:4-5`: "a long author list or venue name is never clipped".** The line is cut with an ellipsis, and the grid overflows the pane at narrow widths.
- **The repeated `':done'` literal:** `Tasks.svelte:158` and `CommandCenterView.svelte:281` (CSS), and `tests/browser/cards.spec.ts:81`, repeat `TICKED` from `rows.ts:20`. The hover-reveal block is duplicated verbatim, 17 lines, in `Tasks.svelte:149-165` and `CommandCenterView.svelte:272-288`.
- **Two views reach into `ui/Ticker.svelte`'s internal markup** (`li > .act`, `data-ticker-id` on `button.name`) through `:global`. A plain row (`Ticker.svelte`, no `data-ticker-id` on `span.name`) can never keep its tick visible.
- **Literal glyph name in state:** `src/lib/state/board/filter-menu.ts:35` `const TICK = 'check'`. This step's other glyphs go through the catalog (`project.card.more_glyph`, `project.action.add_subtask_glyph`).
- **Comment lines hand-wrapped past printWidth 100 mid-paragraph:**
  - `CardActions.svelte:26` (124)
  - `Clamp.svelte:9` (119)
  - `Projects.svelte:25` (112)
  - `map/labels.ts:11` (106)
- **File sizes:**
  - `ui/Menu.svelte` 530 and `map/Graph.svelte` 532 are under the ~600 component guide.
  - `tests/state/board.test.ts` is 986. This step added 7 lines to a file approaching 1000; the new `more` parse test could live in its own file.
- **Colours are tokens throughout** (`--chip`, `--muted-txt`, `--accent`); `ui/` primitives are used, and the non-ASCII gate is clean.

## 4. Behaviour

All screenshots were taken from my own served build on port 8792, before (`shots-base/`) and after (`shots-after/`), light and dark, 1600 and 700 wide.

- **Projects board:**
  - Before: eleven "Filter by" chips in their own row; every card's icons drawn, wrapping on Stream-Anomaly and Graph-Transfer; a long ELI5 drawn whole (543px); ragged rows.
  - After: one "Filter" in the toolbar opening a grouped, scrolling list (`dark-1600-projects-filter.png`); icons hidden until hover; ELI5 cut to four lines with "Show more"; row heights equal (slots 422,422,422,422 / 321,321,321).
  - Not stated in the report: the hidden-strip band on Graph-Transfer at 1600.
- **Narrow pane (editor beside the board, 700 wide):** cards are 320 minimum and wider than the pane (card right 435, pane right 395; this overflow exists on base too).
  - After, the strip sits at the card's right end, so the More opener at 392-422 and Stream-Anomaly's "edit manifest" at 396-422 lie past the pane edge and cannot be pointed at (`narrow-after.log`).
  - On base the wrapped controls started at the left (edit manifest at 131-157) and stayed reachable (`narrow-base.log`).
  - Not stated in the report.
- **Collection (Talks & Events):** the "SUBTASKS 0 open + subtask" line is gone from all three cards, and the cards are one height (`light-1600-events.png`). Adding a first subtask is a hover control.
- **Focus:**
  - Before: 4 to 7 chips drawn on every Command centre and Tasks row.
  - After: hidden until hover, the follow-up's DONE kept; task rows' DONE hidden (section 1).
  - Row names stay truncated, as the report says.
- **Map:** identical on the default demo at both widths and themes; archived labels no longer dimmed (section 1).
- **Lit Watch:** at 1600 the source line ends in "...". At 700, horizontal overflow of the pane (section 1).
- **Memories:** tiles are 4:3 with the picture cropped (decision 1). Placeholder before load, and `data-arrived` is `loaded` at opacity 1 on first open, after a tab switch and after a reload (`meas-after2.log`).
- **Project tab:**
  - The card's "DOCUMENTS README CODE PDF TEX" row and its "SUBTASKS 0 open" line are gone, and one Documents heading remains.
  - The card's controls sit at the far right of a 1450px-wide card, far from its chips (`dark-1600-project.png`).
- **Manifest editor:** help texts replaced; every field that had help still has it (`light-700-editor.png`).
- **More list:**
  - It stays drawn when the pointer leaves the card while open, because focus is inside it (opacity 1).
  - A bottom-row card's list at 700px viewport height sits inside the pane's scroller and every item is hit-testable.
  - A first-row card's list at 820 wide lies over the next row and its items are topmost (`meas-after.log`).
- **Touch:** under Chrome touch emulation (`(hover: none)` true), every control on the board is at opacity 1 (`narrow-after.log`, "touch").
- **Menu's pick signature for other callers:**
  - `Menu.svelte:206-210` passes a third argument only for a grouped choice.
  - The other callers (`ActivityRail.svelte:345`, `RailAppearance.svelte:113`, `Deposit.svelte:299`, `ChangesRepo.svelte:86`, `TerminalRows.svelte:69`, `CardActions`) receive `(id, event)` as before.
  - The rail and theme menus worked in every probe run.

## Not checked

- Content wider than a card now that the card does not clip it (a long unbroken folder or title).
- A real touch device.
- The rice, CRT and wallpaper themes.
- Keyboard arrow walking across the Filter menu's groups.
- A saved filter value no longer among the facet's values (it is counted on the control but cannot be unticked).
- A Memories picture that failed once and is later replaced under the same name (it stays `failed` until remount, from reading `Memories.svelte`).
- The text-size control's effect on Map label boxes.

Reviewer usage: about 65 tool uses, 14:04 to 14:37 (33 minutes).
