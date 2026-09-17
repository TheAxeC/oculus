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
