# Q100 report: the Calendar's fixed strips cover the rows scrolled under them over a wallpaper

Everything in the brief and in repair round 1 is done.

## Open items (main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`, verbatim, read at the end of the round)

- None.

## The cases' first run (tests written, tree unchanged)

`npx vitest run tests/views/whole/tinted.test.ts tests/ui/colours.test.ts tests/views/personal/calendar.test.ts` before any code change printed `Tests  3 failed | 41 passed (44)`.

| Case | First run |
| --- | --- |
| Tree Calendar, `faults(sources)` empty (`has no view that paints a surface of its own ask for it`) | passed, since the tree had no wall mix on the strips yet; with item 3 and without item 1 it fails (revert R5 below) |
| A wall rule on `.ec-header` alone | failed: `expected { missing: [], ...(1) } to deeply equal { missing: [], extra: [] }` |
| A strip plus `.rows` | passed (`extra: [One.svelte]`) |
| A wall rule on `.ec-list .ec-day-head` alone | failed, with the same message |
| `colours.test.ts` with item 3 | passed |
| Calendar style check | failed: `expected '\n        background-color: transpare...' to match /\n\s*background: color-mix\(in srgb, .../` |

No case turned out wrong under the brief's rules. The round 1 cases below were written together with their change.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. Strip predicate in `read()`, head comment | DONE | `tests/views/whole/tinted.test.ts`: `STRIPS`, `LIBRARY`, `selectors()`, `namesStrip()`, `beyondStrips(list, library)`, used by `read()`'s `surface`; head comment lines 12-15 |
| 2. Synthetic cases, both sides | DONE | seven "audits ..." cases at the foot of `tinted.test.ts`, all passing |
| 3. `Calendar.svelte` wall rule with the mix and blur, chip after it, comment | DONE | `Calendar.svelte:353-360`, comment 339-345 |
| 4. `DESIGN.md:216` sentence | DONE | the sentence after "...read as one nearly solid one.", naming the Calendar's headings and the table's sticky header row in `ui/display/Table.svelte` |
| Calendar style case | DONE | `tests/views/personal/calendar.test.ts`, case "audits that over a wallpaper both fixed strips paint the pane mix with the blur, and the date heading its chip after it" |
| R1.1 `:global(...)` holding a list is read as that list | DONE | `namesStrip()` splits the read-through selector at its commas and requires every part to end with a strip; cases R1 and R2 below |
| R1.2 strips narrowed to `.ec-header` and `.ec-list .ec-day-head`, counted only where the script imports `@event-calendar/core` | DONE | `STRIPS`, `LIBRARY` and their comments; cases R3 and R4 below |
| R1.3 `DESIGN.md:216` names the table's sticky header row | DONE | `ui/display/Table.svelte:114-115` carries `:global(body.wall) th { background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent)` (`grep -n "sticky\|body.wall\|wall-panel" src/lib/ui/display/Table.svelte`) |
| Verify 1 | DONE | `sh ~/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`: `Test Files  346 passed (346)`, `Tests  5514 passed (5514)`, svelte-check `COMPLETED 1481 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `All matched files use Prettier code style!`, `verify: 6 commands passed`, exit 0 |
| Verify 2 | DONE | `npx vitest run tests/views/whole/tinted.test.ts tests/ui/colours.test.ts tests/views/personal/calendar.test.ts`: `Test Files  3 passed (3)`, `Tests  48 passed (48)` |
| Verify 3, reverts | DONE | below |
| ASCII gate | DONE | the spec's `perl` gate over `src tests bin config` printed nothing; `LC_ALL=C grep -n '[^ -~]'` over the touched files printed nothing |

## Each case with the change it guards undone

Each revert was applied to the file, the file's tests were run, and the file was restored and checked with `cmp` against the saved copy.

- **R1:** `namesStrip()` without the split at commas (`STRIPS.some((strip) => plain.trim().endsWith(strip))`). Red: `x audits that a global list naming a strip and anything else is a surface`, `expected { missing: [], extra: [] } to deeply equal { missing: [], ...(1) }`.
- **R2:** `selectors(list)` replaced by `list.split(',').map((one) => one.trim())`. Red: `x audits that a global list naming only strips is no surface of the view's own`, `expected { missing: [], ...(1) } to deeply equal { missing: [], extra: [] }`.
- **R3:** `STRIPS` back to `['.ec-header', '.ec-day-head']`. Red: `x audits that a day heading inside a grid's header is no strip`, `expected { missing: [], extra: [] } to deeply equal { missing: [], ...(1) }`.
- **R4:** the library condition dropped (`return selectors(list).some(...)`). Red: `x audits that a strip class counts as a strip only where the calendar library is imported`, `expected { missing: [], extra: [] } to deeply equal { missing: [], ...(1) }`.
- **R5:** `&& beyondStrips(rule[1], library)` dropped from `read()`, which is item 3 without item 1. Red:
  - `x has no view that paints a surface of its own ask for it` (Received `[".../calendar/Calendar.svelte"]`)
  - `x audits that a wall rule on the grid's header alone is no surface of the view's own`
  - `x audits that a wall rule on the list view's date headings alone is no surface of the view's own`
  - `x audits that a global list naming only strips is no surface of the view's own`
  - `x audits that a strip class counts as a strip only where the calendar library is imported`
- **R6:** `selectors(list).some(` changed to `.every(` in `beyondStrips`. Red: `x audits that a wall rule naming a strip and anything else is a surface`, `expected { missing: [], extra: [] } to deeply equal { missing: [], ...(1) }`.
- **C1:** the Calendar wall rule back to `background-color: transparent`. Red: the Calendar style case, `expected '\n        background-color: transpare...' to match /\n\s*background: color-mix\(in srgb, .../`.
- **C2:** the chip rule moved before the shorthand rule. Red: the Calendar style case, `expected 2357 to be greater than 2516`.
- **Corrected premise:** the chip and the mix in one `background` shorthand. `colours.test.ts` is red with `...ec-day-head): background: linear-gradient(...), color-mix(in srgb, var(--panel) var(--wall-panel), transparent) (raw colour)`.

## Files

- `tests/views/whole/tinted.test.ts` 352 lines
- `tests/views/personal/calendar.test.ts` 442 lines
- `src/lib/views/personal/calendar/Calendar.svelte` 411 lines
- `DESIGN.md` line 216 only
- this report

## Judgment calls (reversible)

- The new cases that render nothing are named "audits ...", since `tests/checks/tree/audits.test.ts` refuses a new non-rendering case under `tests/views` that is not so named, and `allow-audits.txt` is outside this step's paths.
- `LIBRARY` is matched as `from '@event-calendar/core'` (either quote) anywhere in the component's source.
- The synthetic partial built by `strip(selector, library)` carries the library import unless `library` is false.
- The Calendar comment calls the strip "a second layer of the pane's colour".

## User-visible changes, before and after (for the look)

Look at the Calendar under a wallpaper theme (tokyo night) on TEST.

- **Time grid day headings (week view, hours scrolled under the header).** Before: transparent with the blur, and the rows readable through them. After: the pane's mix (`color-mix(in srgb, var(--panel) var(--wall-panel), transparent)`) with the blur over the tint, and the rows hidden.
- **List view date headings (rows scrolled under a heading).** Before: transparent with the blur, and the rows readable through them. After: the pane's mix with the blur, and the rows hidden. Today's heading keeps its chip.
- **Time grid all-day row.** It sits inside the sticky header and now carries the pane's mix with it. Before: transparent with the blur, and the rows readable through it. After: the mix.
- **Month view weekday row.** It does not scroll. It now carries the mix, one step darker than the pane's tint. Before: transparent with the blur, over the tint. After: the mix, over the tint. This matches the `background-color: var(--panel)` the row already has without a wallpaper.
- **Plain theme:** no change.

## Wrong in the brief

Nothing beyond the premise the brief already corrected; the corrected-premise revert above confirms it.

## Limitations

- `STRIPS` names the strips by class and `LIBRARY` by import. A sticky strip of another library, or of this one under another class, counts as a surface until it is added.
- `grep -rn "ec-header\|ec-day-head\|never two\|one translucent layer" src tests config HELP.md DESIGN.md README.md` found no other sentence the change makes false. `Pane.svelte:54`, `PaneView.svelte:436` and `Memories.svelte:335` speak of views without such strips.
- The on-screen result is not verified here: rows hidden, chip visible, and the two extra rows above. It is for the look on landing.
