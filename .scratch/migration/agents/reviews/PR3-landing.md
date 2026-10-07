# PR3 landing

Position: oculus/migration, step PR3 (Present decks edited and generated in oculus) landed; next, D23c lands, then PR4, D45, X3e, M8, D43, D23b and D33 are prepared.

Open items: none.

Agents stopped before the landing: the builder a348cc74b67ed634e, the brief check a8ea4645a98e6dde0 and both reviewers (aa378ab34c21e2821, a22d168bb7ca66506) had all finished; none was running.

NOT DONE: case 25 (Export to PDF in a browser tab) was not looked at, since the browser's print dialog is a modal the browser automation must not open. The live redraw of case 16 was not timed end to end, since the Chrome window reported `visibility: hidden` and Chrome slowed its timers (a 250 ms timer fired after 1131 ms); its parts were measured, as below.

## What landed

From base 272f60b4, 114 files, +5563 -1375, then the fixes at landing:

- The slide acts (Edit Slide, New Slide, Duplicate Slide, Delete Slide) in a right-click menu on the slide and its overview tile, and in the command palette while the pane is on screen. They are written through the `deck-edit` write, with History records and undo.
- An image dropped on a slide is copied into the deck's folder under a free name and linked at the end of the slide's text, percent-encoded.
- The slide is drawn live from the unsaved text of a source tab on the same page, through `POST /api/deck`.
- New Presentation and From outline.
- Export to PDF:
  - The `/present/print` route draws every slide in its frame.
  - The desktop app prints that route in a hidden window through `printToPDF`.
  - A browser tab opens the browser's print dialog.
  - No new dependency.
- The Slides catalog's Save is one `deck-slides` write carrying several lists, and an order entry moves whole.
- The 40 deck lines of part 8 are reworded (Z667).

## Fixes at landing

- From the merge with main:
  - The conflicts in `Palette.svelte`, `app.yml`, `docs/window.md`, `DESIGN.md` and the diagrams, resolved with both sides kept (Z642).
  - PR3's `shell/keys/command-runs.ts` is dropped and main's Open Folder is kept, since main had moved the workspace commands out of the palette and lint found the module's functions unused.
- From the review over round 1:
  - R1: an undo that fails part way removes a file its act left absent, instead of writing it empty.
  - R3: `READY_WAIT_MS` and `MAX_UPLOAD_MB` now live in `data/file-ops.ts`.
  - R4: the change-log size sentence in `config/behavior.yml`.
  - R5 and R6: the prune row has a section of its own, and its label is in `guarded.md`.
  - Z675: an image name with a space, a parenthesis, `#`, `%` or `?` is percent-encoded. New rows in `deck-acts.test.ts` and `present.test.ts`; on PR3's code before the fix, `Tests 1 failed | 6 passed (7)`.
  - R2 is kept as built: the undo of a duplicate in a file of several slides cuts the copy back out by its text.
  - R7, the first build's git commands, is a fact of that build.
- From the look:
  - The live draft now waits 50 ms where it waited 250 ms, since the wait alone used all of case 16's 250 ms (`acts/live.svelte.ts`, `docs/views.md`).
  - After an act writes, each source tab over a file of the deck's folder that holds no unsaved text reads its file again. Before, Edit Slide's tab kept the old text, which a later save would have written back over the act (`acts/run.ts`, `acts/acts.svelte.ts`, `Present.svelte`).
  - The guide's sentence on a member deck's slide now says it offers Edit Slide and New Slide.
  - A comment line past column 100 in `file-ops.ts` is rewrapped.

## Verification, on main

```
$ npm run diagrams && npm run test:landing
ok      ASCII gate (1.7 s)
ok      npm run lint (7.4 s)
ok      npm run format:check (17.5 s): All matched files use Prettier code style!
ok      npm test (74.1 s)
ok      npm run test:checks (199.7 s)
ok      npm run check, then npm run build, then npm run test:slow (209.5 s)
test:landing: 209.5 s; every command passed
```

The run before the look fixes was green on every command but `test:checks`, which failed on the `file-ops.ts` comment past column 100. The start.test.ts rows passed in every run.

## The look

The look ran on a scratch oculus on port 8794, over a copy of the hub's `deck/` in a scratch hub with HOME under the scratchpad, so no write reached `deck/` or a project. Port 8790 was left untouched. Both themes were looked at.

- Case 16: the slide drew the typed heading without a save, and Revert drew the file's text again. The timer starts 30 ms after the keystroke and the deck answer took 115 to 140 ms, so with the 50 ms wait the redraw comes about 200 ms after the keystroke.
- Case 18: the first drop wrote `fig.png` and the second wrote `fig-2.png`, both linked and drawn. After the reload fix, the open `title.md` tab showed `![fig-3](fig-3.png)` after a third drop.
- Case 11a: Edit Slide on a summary opens `present.yml` at line 48, the entry's line.
- Case 12: a member deck's slide offers Edit Slide and New Slide and opens `projects/manuscripts/hccnet-revision/present/main.md`.
- Case 27: the grid entry's five lines moved whole above `transition.md`. History shows a "deck order" row with 9 values before and after, and its Undo put the order back.
- Case 24: PR3's `printPdf` ran in a windowless Electron run over the scratch print route: `PRINT {"ok":true,...,"bytes":4194758,"ms":3048}`; `pdfinfo` gives 21 pages, 960 x 540 pts. `pdftotext` reads the first page's text. The pages print in the page's saved theme, which this run did not have, so they came out dark.

## Usage

- Builder a348cc74b67ed634e (claude-sonnet-5-5): 200,916 tokens, 54 tool uses, 30.0 min; round 1: 309,126 tokens, 179 tool uses, 27.0 min.
- Brief check a8ea4645a98e6dde0: 218,976 tokens, 88 tool uses, 12.1 min.
- Reviewer aa378ab34c21e2821: 126,998 tokens, 108 tool uses, 15.8 min.
- Reviewer over round 1 a22d168bb7ca66506: 261,986 tokens, 75 tool uses, 16.6 min.

The first report did not pass its bar, and the step needed one repair round.

## Next

D23c lands, then PR4, D45, X3e, M8, D43, D23b and D33 are prepared into the free slots.
