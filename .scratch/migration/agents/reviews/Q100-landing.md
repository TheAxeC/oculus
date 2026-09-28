# Q100 landing

Roadmap entry oculus/migration (the oculus migration plan). Plan step Q100: the Calendar's fixed strips cover the rows under them over a wallpaper. Next: Q79d's review, then `/spec` Q101.

## Open items

- None.

## Agents

TaskStop on the builder and both reviewers found none running; `ListAgents` listed only Q79d's builder.

## Landed

- `tinted.test.ts`: a wall rule naming only the calendar's sticky strips, in a component that imports `@event-calendar/core`, is no surface of the view's own.
- `Calendar.svelte`: under `body.wall` the header row and the list date headings carry the panel's colour at `--wall-popover` with the wallpaper blur, the list heading's chip after it; the list view's event titles at `--fs-sm`.
- `DESIGN.md:216`: the strips and a table's sticky header row.

## Fixes at landing

- The library rule counts only a value import in a script; a comma inside a pseudo-class no longer splits a strip's selector.
- The strips at 97% in place of 76% (Z44 (b)); the list titles at the Calendar's size (Axel, from the look).

## Checks

- `npm test` ran once: red only on the git cap case in `tests/server/core/git.test.ts`, which Q100 does not change; that case is tagged slow and left out of `npm test` (4390ffda).
- `npm run check` 0 errors (1483 files), build, format and lint clean; the three changed-area test files 50 passed.
- Look on TEST under tokyo night: the week header, the month weekday row and the list date headings hide the rows scrolled under them; header background alpha 0.97. Theme set back to vscode dark modern.
