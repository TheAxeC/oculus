# Step D22 builder report

NOT done (premise wrong, a stop to book): 1) The people case. There is no people card. `registries/people.yml` is not one of the `collections:` in `config/sources.yml:48-59`. A person's `folder` is drawn only by `views/Person.svelte:192-213`, which is outside decision 5's paths. So no Show in Files control exists for a person's supervision folder, and the browser test "from a people card with `folder`" is not written. The Person view's folder block would need `layout.showInFiles(folder)` on a toolbar or block control. 2) Venue cards. They are `views/venues/VenueCard.svelte`, also outside decision 5, so a venue gets no control. In the real hub `registries/venues.yml` has 62 `link:` values and all are web addresses (`grep -E '^[[:space:]]*link:' registries/venues.yml | grep -vc http` prints 0), so nothing is visible today. Everything else in the brief is done.

## DONE / NOT DONE
| Item | State | Proof |
|---|---|---|
| 1. Opening function | DONE | `showInFiles(path, root = 'hub')` in `state/layout.svelte.ts:856` calls `openView('files')` (activates the current page's Files tab or opens one there) and writes `revealAsked(...)` into that instance. The pure parts are in `state/fs.ts`: `revealAsked`, `resolveReveal`, `revealSettled`, `revealScrolled`, `hubPathsOf`, `revealPathOf`, `ancestorsOf`. The store gains `readListing` in `state/fs.svelte.ts` |
| 2. Controls | DONE, except people and venues (above) | `ProjectCard.svelte`: `files` control after the Finder `folder` control, so it also shows on the project view's card. `EntryCard.svelte`: one `files:<path>` control per `link`/`folder` hub path, on schema and no-schema cards alike |
| 3. Loading and scroll | DONE | `views/files/ShowPath.svelte` reads the folders on the way outermost first, settles the ask, scrolls the row once drawn and draws the outcome line |
| Node tests | DONE | `npx vitest run --reporter=dot` gives `Test Files 247 passed (247)`, `Tests 4149 passed (4149)` |
| check | DONE | `npm run check` gives `COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| build | DONE | `npm run build` exit 0 |
| format | DONE | `npm run format:check` gives `All matched files use Prettier code style!` |
| lint | DONE | `npm run lint` exit 0 |
| ASCII gate | DONE | the perl gate from the brief printed nothing |
| Sizes | DONE | largest files `tests/state/layout.test.ts` 970 and `tests/state/board.test.ts` 980 (not mine); `Files.svelte` 585 |
| Browser specs | DONE | `npx playwright test tests/browser/show-in-files.spec.ts tests/browser/files.spec.ts tests/browser/files-forms.spec.ts tests/browser/cards.spec.ts` gives `50 passed (1.4m)`. Extra run: `collection`, `funding`, `icons`, `person` specs give `11 passed` |

## In-flight, superseded and after-close
All three are proven in both suites.
- Node: `revealSettled` returns null for a later ask, a closed tab and an ask another mount already settled. The awaited read answers even when the round moved on.
- Browser: `show-in-files.spec.ts` holds the `projects/active` listing with `page.route`.
  - In flight: the Files tab is open and nothing is selected.
  - Superseded: a later ask from a funding card selects `hub:funding/funding.yml`, and it is still selected after the held answer lands.
  - After close: once the tab is closed and the held answer lands, `localStorage` holds no record for the closed instance id.

## Reverts run
Each revert was applied, the one test run, then the source restored and rebuilt.
- Node, all 37 went red with `AssertionError` (harness `scratchpad/d22-builder/reverts.py`):
  - `showInFiles`: ask written to another id; `openView` given a random id; opened on the first page.
  - `revealAsked`: filter kept; count restarted from the ask.
  - `askOf`: empty root accepted; asked/settled check dropped.
  - `resolveReveal`: prefetch deepest first; prefetch all; always `found`; last name must be a folder; walk through a file; error ignored; roots check dropped; root line read.
  - `ancestorsOf`: includes the row itself.
  - `revealSettled`: row itself opened; `revealed` cleared; `sameAsk` dropped; write when no ask is held; `settled` ignored in `sameAsk`.
  - `revealScrolled`: clears unconditionally.
  - `hubPathsOf`: `://` only; empty-path check dropped. `revealPathOf`: empty segments kept.
  - `readListing`: calls `loadListing` directly; stale round answers empty; offline check dropped.
  - `lineOf`: four variants.
  - ProjectCard control dropped (both project tests). EntryCard `shows` dropped (both branches). `hubPathsOf` taking every link.
- Browser, all red:
  - scrollIntoView removed: `toBeInViewport() failed`.
  - ancestors not opened: `toHaveAttribute failed`.
  - ProjectCard control dropped: click timeout.
  - EntryCard `shows` dropped: click timeout.
  - always found: `toHaveAttribute failed`.
  - `sameAsk` dropped, superseded case: `toHaveAttribute failed`.
  - `sameAsk` dropped, after-close case: `not.toContain failed`.

## Decisions (each reversible)
- **Path rule is stricter than decision 2's `scheme://`.** It reuses `state/collection.ts` `isHubPath`: no scheme of any kind (`mailto:` included) and no leading slash. A value that normalises to empty (`./`) gets no control, and two values naming one place get one control.
- **Fields are named, not schema-driven.** They are `PATH_FIELDS = ['link','folder']` in `state/fs.ts`, read from `entry.fields`.
- **An ask clears the Files filter,** since a filter would hide the row.
- **The target is selected but not opened;** only its ancestors are opened.
- **Instance state gains three keys:** `reveal`, `revealed` and `revealing`. The outcome is kept in state and cleared when the reader selects a row.
- **Outcome kinds:** `missing` (nearest folder selected), `unread` (the folder that failed is selected, with the error) and `no-root` (nothing selected).
- **An ask waits while the workspaces are loading or failed.** No line is drawn in that state.
- **Label and glyph:** "Show in Files". Glyph `show_in_files` is a crosshair glyph with Lucide `folder-search`; its ASCII stand-in is `[@]`, added at the end of the `ascii:` map. The glyph name is added at the end of the `glyphs:` map, since the file ends with the `ascii:` map.
- **Split out of Files.svelte:** `refusal()` moved verbatim to `views/files/refusal.ts`.

## Sharp edges
- **Maximised pane:** if the page's Files tab sits in a pane hidden behind a maximised one, `openView`'s existing rule opens a second Files tab in the maximised pane.
- **Keyboard focus stays on the card control that was pressed;** it does not move to the row.
- **The scroll is a DOM query** (`[data-instance] [data-fs-row]`) inside an effect.
- **`..` segments are kept,** so such a path resolves to the folder it climbs from and says "missing".
- **Tests outside the named files:** `tests/views/type-scale.test.ts` gained the `files/ShowPath.svelte` row, and `tests/state/explorer.test.ts` expects the three new keys.

## Before and after
- **Project card (board and project tab):**
  - Before: pin, copy, ask, folder (Finder), toggle, present, subtask, edit, deposit.
  - After: a "Show in Files" icon control directly after folder. Pressing it activates or opens Files on this page, with `hub`, `projects`, `projects/active` open and the project row selected and scrolled to centre.
- **Collection card (funding, applications, events, education, tasks and others)** with a `link` or `folder` hub path: a new last control does the same for that path. A card with a web address gets nothing.
- **Files view:** a muted line under the header when an ask did not find its path, for example "hub/projects/active/no-such-project/README.md is not there; hub/projects/active, the nearest folder on its way, is selected."

## Doc text
HELP.md line 75, replace "The folder control shows the project folder in Finder." with:
"The folder control shows the project folder in Finder, and Show in Files selects it in the Files tab of the page, opening one there when the page has none."

HELP.md line 85, append:
"Show in Files on a project card, the project tab or a collection card whose `link` or `folder` is a path of the hub opens this view on the page with the folders above that path open and the path selected and scrolled into view, and clears the filter; a path that is not there selects the nearest folder on its way, and a line under the header says so, as it does for a folder on the way that cannot be read."

DESIGN.md, a new decision line after the 2026-09-17 entries:
"- 2026-09-17, showing a path in the file browser. `layout.showInFiles(path, root = 'hub')` activates the Files tab of the page the reader is in, or opens one there, and writes an ask `{ root, path, asked, settled }` into that instance's state, clearing its filter; a Files tab on another page is left alone. `views/files/ShowPath.svelte` reads the folders on the way outermost first through the fs store's `readListing`, one request per folder per round shared with the render, and writes the open ancestors, the selection and the outcome only while the instance still holds that ask, so an answer after a later ask, after the tab closed or after another mount settled it writes nothing; the row is scrolled into view once drawn and the ask is cleared. A path not there selects the nearest folder on its way and the outcome line says so, and an unreadable folder and a root the workspace lacks are said the same way. The control is on the project card, beside the Finder control, and on a collection card for each `link` or `folder` value that is a hub path by `state/collection.ts`'s `isHubPath`."

## Files changed (lines now)
All under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/d22/tools/oculus/`.
- New:
  - `src/lib/views/files/ShowPath.svelte` 111
  - `src/lib/views/files/refusal.ts` 22
  - `tests/state/show-in-files.test.ts` 455
  - `tests/browser/show-in-files.spec.ts` 259
- Source:
  - `src/lib/state/fs.ts` 665
  - `src/lib/state/fs.svelte.ts` 809
  - `src/lib/state/layout.svelte.ts` 930
  - `src/lib/views/Files.svelte` 585
  - `src/lib/views/shared/ProjectCard.svelte` 475
  - `src/lib/views/collection/EntryCard.svelte` 493
- Config:
  - `config/text/views/files.yml` 89
  - `config/text/views/project.yml` 137
  - `config/text/views/collection.yml` 68
  - `config/glyphs.yml` 283
  - `config/icons.yml` 149
- Tests changed:
  - `tests/state/explorer.test.ts` 377
  - `tests/views/files.test.ts` 849
  - `tests/views/collection.test.ts` 928
  - `tests/views/projects.test.ts` 820
  - `tests/views/project.test.ts` 450
  - `tests/views/type-scale.test.ts` 243

The `git diff --stat` total was 17 files, 469 insertions and 52 deletions, taken before the two comment rewraps.


All ten rulings of the repair round are done. The six first-round decisions still stand, and three are open for you to overrule: the path rule (a value that is any address, not only `scheme://`, gets no control), clearing the Files filter on an ask, and selecting the target without opening it.

## Repair round

### What was checked (commands run from `tools/oculus` in the worktree)
| Check | Result |
|---|---|
| `npx vitest run --reporter=dot` | `Test Files 247 passed (247)`, `Tests 4157 passed (4157)`. No test timed out. |
| `npm run check` | `COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | exit 0 |
| `npm run format:check` | `All matched files use Prettier code style!` |
| `npm run lint` | exit 0 |
| ASCII gate (the perl form) | printed nothing |
| `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -3` | largest are `tests/state/layout.test.ts` 970 and `tests/state/board.test.ts` 980. `Files.svelte` is 592. |
| `npx playwright test` over show-in-files, files, files-forms, cards, person, venues-themes | `56 passed (1.8m)`. I waited for the lock on 8792 when another run held it and signalled nothing. |

### Rulings
| # | State | What was built | Proof |
|---|---|---|---|
| 1 | DONE | **Person folder.** `views/Person.svelte`: the folder block's heading carries a Show in Files ToolButton calling `showInFiles(folder)`. `person.yml` gains `show_in_files` and `show_in_files_tip`. | View case "offers Show in Files for the supervision folder...". Browser case "Show in Files on a person's supervision folder selects that folder": it writes `folder: "projects/active/streaming-anomaly"` for rivera-lab into the served people file and restores it. |
| 2 | DONE | **Venue link.** `VenueCard.svelte`: a Show in Files ToolButton when `hubPathsOf({ link })` gives a path. For such a path the site link is `hrefOf(path)` with no `target=_blank`; otherwise it stays external. `venues.yml` gains the two strings. | Two cases in `tests/views/venues.test.ts`: one with a path, one with a web address. |
| 3 | DONE | **Maximised pane.** `showInFiles` finds the page's Files tab. When a maximised pane hides it, it calls `restorePanes(page)` and then `openView('files', undefined, page)`. The comment at `layout.svelte.ts:133` is fixed. | Node case "gives the panes back and activates the Files tab a maximised pane hides...". Browser case "...behind a maximised pane...": Files split right, Projects maximised, press; the result is 2 panes, one Files tab, the row selected. |
| 4 | DONE | **`..` segments.** `normalisePath` in `state/collection.ts` drops empty and `.` segments, and each `..` removes the segment before it. `revealAsked` asks by the normalised path. `hubPathsOf` gives no path for a value climbing above the hub. | Node cases: `network/../funding/funding.yml` resolves `found` at `funding/funding.yml`. `../outside/secret.txt` gets no control; asked directly, it reads only `hub:` and shows the root line. |
| 5 | DONE | **Fields.** `hubPathsOf` and `PATH_FIELDS = ['link','url','folder']` now sit beside `isHubPath` in `collection.ts`. EntryCard and VenueCard import them from there. | Node case "takes a hub path from `link`, `url` and `folder`..." |
| 6 | DONE | **Workspaces read failed.** A new outcome `no-roots` (`rootsUnread` in `fs.ts`). `ShowPath.svelte` answers a waiting ask at once when `rootsError` is set, with the line `files.reveal_no_roots`. | Node case: `reveal` is null afterwards and a later answer writes nothing. View case for the line. Browser case with the `GET /api/fs` workspaces route failed: the line shows at once and the record's `reveal` is null. After unroute and reload the tree draws with nothing selected and `hub:projects/active` not drawn. |
| 7 | DONE | **Proof gaps.** | See the four items below. |
| 8 | DONE | **Wording and placement.** | See the three items below. |
| 9 | DONE | **Doc text.** | Given below. |
| 10 | DONE | **Verify list.** | The table above. |

**Ruling 7, the proof gaps:**
- **Ask cleared after the scroll.** The project-card browser case now polls the record until `reveal` is null and checks that `revealing` is 1.
- **The `openBeside` revert.** The node case now asserts the pane count is unchanged, so that revert turns it red.
- **Explorer changes.** The changed explorer cases in `tests/state/explorer.test.ts` now name their reverts: on `NO_REVEAL`, and on the "reads what the instance keeps" case.
- **The unexplained miss.** It did not recur. I added the split sequence as a case that prints the instance record on a miss, and ran `npx playwright test tests/browser/show-in-files.spec.ts -g "split beside the board" --repeat-each 40`: `40 passed (1.5m)`, no miss, so no record was printed. The cause is not determined; nothing in these runs points at the page.

**Ruling 8, the fixes:**
- **`refusal.ts` comment.** It now says it names `handleFsWrite`'s action refusals. The four request-level codes (`origin`, `token`, `not-json`, `not-an-action`) and any later code are shown as the code itself.
- **Glyph placement.** `show_in_files` sits under its own comment, placed before the inbox numbers comment.
- **The offline word.** The `OFFLINE` literal is gone. Where there is no page, `readListing` answers with `t('files.read_offline')`.

### Reverts run (each one red)
**Node, repair round** (harness `scratchpad/d22-builder/reverts2.py`). All 12 turned the named case red with an `AssertionError`:
- `showInFiles` using `openBeside`
- `restorePanes` dropped
- `rootsUnread` returning `no-root`
- the `..` checks in `hubPathsOf` dropped
- `normalisePath` keeping `..`
- `revealAsked` using the raw path
- `url` removed from `PATH_FIELDS`
- the `no-roots` line dropped
- the Person ToolButton dropped
- the venue site link always external
- `hubPathsOf` taking every link (venues case)
- `filesViewOf` without `revealed`

**Node, first round, rerun** against the repaired tree (`reverts.py`, entries moved to `collection.ts` and `normalisePath`). All 37 red with `AssertionError`.

**Browser, repair round** (`browser-reverts.py`, rebuilt before each). All 4 red:
- `revealScrolled` write dropped: `expect(received).toBeNull()`
- `restorePanes` dropped: `toHaveCount failed`
- roots-failed effect disabled: `toHaveText failed`
- Person `showInFiles` call dropped: `toHaveAttribute failed`

### Doc text

**HELP.md line 75.** Replace "The folder control shows the project folder in Finder." with:
"The folder control shows the project folder in Finder, and Show in Files selects it in the Files tab of the page, opening one there when the page has none."

**HELP.md line 81 (`venues` row).** Inside the cell, before the closing `|`, add:
"A venue whose `link` is a path of the hub opens it in this tab and carries Show in Files."

**HELP.md line 85 (`files` row).** Inside the cell, before the closing `|`, add:
"Show in Files opens this view on the page, restoring the panes when a maximised pane hides it. It is offered on a project card and the project tab, on a collection card whose `link`, `url` or `folder` is a path of the hub, on a venue card whose `link` is one, and on a person's supervision folder. The view opens the folders above that path, selects the path, scrolls it into view and clears the filter. A path is read by its segments, so `a/../b` is `b`, and a value that climbs above the hub gets no control. A path that is not there selects the nearest folder on its way, and a line under the header says so. The line also names a folder on the way that cannot be read, a root the workspace lacks, and roots the file browser could not read at all; in that last case the ask is answered at once and not later."

**HELP.md line 120.** In the `person` parenthesis, after "the files of their supervision folder", add:
", with a Show in Files control on that folder"

**DESIGN.md line 333.** Replace "Its instance keeps `expanded`, `selected: { root, path }`, `filter` and `collapsed`." with:
"Its instance keeps `expanded`, `selected: { root, path }`, `filter`, `collapsed`, the open form, and the three keys of an ask to show a path: `reveal` (`{ root, path, asked, settled }`), `revealed` (the last outcome not found as asked) and `revealing` (the count of asks)."

**DESIGN.md, the decision line after the 2026-09-17 entries:**
"- 2026-09-17, showing a path in the file browser. `layout.showInFiles(path, root = 'hub')` activates the Files tab of the page the reader is in, restoring the panes first when a maximised pane hides it, or opens one there; a Files tab on another page is left alone. It writes an ask `{ root, path, asked, settled }` into that instance's state, clears its filter, and normalises the path by segments through `state/collection.ts`'s `normalisePath`. `views/files/ShowPath.svelte` reads the folders on the way outermost first through the fs store's `readListing`, one request per folder per round shared with the render. It writes the open ancestors, the selection and the outcome only while the instance still holds that ask, so an answer after a later ask, after the tab closed or after another mount settled it writes nothing. The row is scrolled into view once drawn and the ask is cleared. A path not there selects the nearest folder on its way and the outcome line says so; an unreadable folder and a root the workspace lacks are said the same way. An ask made while the roots could not be read is answered at once with that failure. The control appears on the project card beside the Finder control, on a collection card for each `link`, `url` or `folder` value that `hubPathsOf` in `state/collection.ts` counts as a hub path (not an address and not climbing above the hub), on a venue card's `link` by the same rule (whose site link then opens in this tab), and on the Person view's supervision folder."

### Files changed (lines now)
All under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/d22/tools/oculus/`.

- **New files:**
  - `src/lib/views/files/ShowPath.svelte` 124
  - `src/lib/views/files/refusal.ts` 24
  - `tests/state/show-in-files.test.ts` 543
  - `tests/browser/show-in-files.spec.ts` 396
- **State:**
  - `src/lib/state/collection.ts` 787
  - `src/lib/state/fs.ts` 645
  - `src/lib/state/fs.svelte.ts` 807
  - `src/lib/state/layout.svelte.ts` 941
- **Views:**
  - `src/lib/views/Files.svelte` 592
  - `src/lib/views/Person.svelte` 297
  - `src/lib/views/venues/VenueCard.svelte` 234
  - `src/lib/views/collection/EntryCard.svelte` 494
  - `src/lib/views/shared/ProjectCard.svelte` 475
- **Config:** `glyphs.yml`, `icons.yml`, and `text/views/` `files.yml`, `project.yml`, `collection.yml`, `person.yml`, `venues.yml`.
- **Tests changed:**
  - `tests/state/explorer.test.ts`
  - `tests/views/files.test.ts`
  - `tests/views/collection.test.ts`
  - `tests/views/projects.test.ts`
  - `tests/views/project.test.ts`
  - `tests/views/person.test.ts` 287
  - `tests/views/venues.test.ts` 423
  - `tests/views/type-scale.test.ts`

`git diff --stat`: 24 files changed, 623 insertions and 64 deletions, plus the 4 new files.

### Known limits
- **The reviewer's miss.** It is not reproduced and its cause is not determined (40 of 40 passed).
- **Stale outcome line.** A `revealed` outcome is saved with the instance, so after a reload the line stays until a row is selected. In the roots-failed browser case the line is still shown after the reload.
- **Keyboard focus.** After a press, focus stays on the pressed control and does not move to the row. This is not tested with the keyboard.
- **Terminal themes.** Drawing the `[@]` stand-in in a terminal theme is not checked.
