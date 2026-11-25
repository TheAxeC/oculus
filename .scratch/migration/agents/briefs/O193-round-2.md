# O193, repair round 2: the Focus page screenshot

This round adds an item the user ruled after the look (ruling "README screenshots, the Focus page", plan.md Rulings): an acceptance item the step does not build yet. The brief, the rules file and the prompt you were launched with still hold: you never run the capture, Electron, a server or a page, and you write no script beyond the capture command.

The worktree now holds the orchestrator's fixes from the look, on top of your work (the patch is `.scratch/migration/agents/reviews/O193-landing-fixes.patch` in the main ledger; read it first, and read the four changed files whole before you change them):

- `utils/shots/hub.mjs`: the dark theme and code theme of the research hub (`THEME`, `CODE_THEME`, ruling "README screenshots, the theme"); a `.gitignore` in the copy carrying the worktrees rule (`ignoreWorktrees`); the Explorer's left pane at 0.3 (`narrowExplorer`, `EXPLORER_LEFT`, ruling "README screenshots, the layout"); `status_bar.quiet` and `blame` and `bell` hidden (the second review's B-R1 and B-R2).
- `utils/shots/page.mjs`: the wait on the commit graph in Source Control.
- `utils/shots/shots.mjs`: the removal of Electron's userData folder by a detached shell after `app.exit`, which emits no process exit event.
- `README.md`: the alt text names the Dark Modern theme.
- `docs/images/projects-board.png` and `docs/images/explorer.png`: the shots of the look, which the user approved. They are replaced at the next look.

The right-hand float (Live HPC, Usage) stays drawn on every shot, as the user ruled; do not close it.

Paths this round writes: `utils/shots/*.mjs`, `README.md`, and the round's part of `.scratch/migration/agents/reviews/O193-report.md`.

1. A third capture, `docs/images/focus.png`, of the Focus page: the rail's Focus button (its label from `loadConfig`, the page `focus`), its default arrangement (`config/defaults/layout.yml` `focus:`), with no menu open, waiting on the element that shows the Focus view drawn with its content (read `src/lib/views` for the Focus view and name the element you wait on and why it shows the drawn state, not a loading one). It is taken first, before the Projects board, so the order of the shots is the order of the rail. `SHOT_NAMES` gains it, the size check and the move into `docs/images/` cover all three, and a failed run still leaves no mixed set.
2. Read what the Focus page draws on the demo copy and name, in the report, anything on it that comes from this machine or its user rather than from the copy (mail follow-ups, calendars, accounts, sessions, the clock or today's date), with the file and line that draws it. Anything of the machine or the user is kept off the shot by a setting of the workspace file, as `HIDDEN_ITEMS` is; anything that draws the day of the run (a count of days to a deadline) is listed with what it draws, since it changes from day to day.
3. `README.md`: under "What it shows", after the line "Each button on the rail at the left opens a page:" and before its list, the image `docs/images/focus.png` with alt text that says what the picture shows, as the two others do; the "Run from source" sentence says three screenshots. Nothing else in the README changes.
4. The head comments of `shots.mjs` and `page.mjs` name the three shots.

Run after your last change, once, the brief's whole "Verify before you report" list, with `utils/shots/*` in the ASCII gate and the size and folder checks, and append to the report a section "Repair round 2" with: what changed (file and line), the Focus element waited on and why, the list of item 2, the Verify lines as printed, the number of runs of that last round, and the files with their new line counts.
