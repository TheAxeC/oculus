# L6 landing

## Open items, verbatim from the state file

None.

Booked list: 3, carried for O32 (its skill half, in the installed plan skills), Q69 (what earlier landings left, the check of seven landed steps, and the Help view's blur under a wallpaper theme found in this look) and Q70 (watchers under file-event load).

## NOT DONE

Nothing of L6's brief.

## What landed

L6, cherry-picked from `.agents/worktrees/L6` at base `7319fa60` by `tools/oculus/.scratch/migration/land.sh L6 7319fa60 <runs> --no-browser` (+6,593 -1,955 over 83 files), then the Doc text applied (+6 -5 over DESIGN.md and HELP.md), the browser suite run by hand.

- The status bar is drawn as VS Code's: 22 px across the whole window under the rail, where it sat right of the rail before; every item 12 px with an icon and a tooltip, fixed at every text scale.
- Left group: the machine's name (opens Status), the branch of the active tab's repository (a list of its branches to switch to, after a confirmation), behind and ahead (pushes after a confirmation when only ahead, else opens Repositories), the Findings view's count (opens Findings), HPC, usage, server.
- Right group, for a source tab: line and column (the palette on `:`, `:<number>` goes to that line), indentation (spaces or tabs, width, convert), UTF-8, LF or CRLF (convert), the language (`:language`, a searchable list); then live sessions, unsaved tabs, the bell.
- A right-click on the bar hides or shows any item, kept per browser.
- The bell, the notification centre with Clear, Clear All and Do Not Disturb (kept across reloads), and toasts for eight seconds. Five sources: a refused rail write (the fixed red line under the rail is gone), a session waiting on a permission prompt or idle after its turn, an update task that ran, a Live HPC job that ended, a write refused or unanswered.
- Under the terminal themes the branch glyph draws `[Y]` everywhere, the Repositories view's branch rows included, and the caret `[I]`, so neither reads as a separator.

## What was found

The first review found the findings item on the audit's count and view, where the orchestrator's brief had cited the audit's count; the brief's narrowing of Axel's waiting ruling to permission prompts; the caret's stand-in reading as a separator; and the report's before and after missing four visible changes. The brief was corrected before the round, and the round closed each. The run over the round found nothing in the code: the branch stand-in's reach into the Repositories view is needed and is stated here; four new stand-ins repeat older ones, which the vocabulary already does in 32 places and no rule forbids. Every finding is under the Closed heading of `agents/reviews/L6-refuter.md`.

For Axel: the bar now runs the whole width under the rail, as VS Code draws it; it was right of the rail before. Taken as covered by "drawn like VS Code's"; say so if it goes back.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 297 passed (297); Tests 4718 passed (4718)
npm run check                       COMPLETED 1361 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
LC_ALL=C grep -rna '[^ -~]' src tests | wc -l    0
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npx playwright test                 373 passed (7.9m)
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
ListAgents                          no subagent listed
```

The revert checks were run by the reviewers on the worktree (227 reverts over the first run's files, 51 over the round's, 0 unproven); the landing changed no test file.

## The look, on the TEST page

Axel's dev server on 8790 served the landed tree without a restart. On TEST, with the source tab `icons.yml` active:
- vscode-dark-modern: 22 px, 1,512 px wide from x 0, every item 12 px; left `YQ530VVFGK`, `main`, `0 16` (behind, ahead), `0` findings, `unreachable`, `ok`, `up`; right `Ln 1, Col 1`, `Spaces: 4`, `UTF-8`, `LF`, `YAML`, `4`, `0`, the bell. The notification centre opens above the bar's right end: "NOTIFICATIONS", Clear All, Do Not Disturb, hide, "No new notifications", as VS Code draws it.
- light: bar `rgb(241, 245, 249)`, border `rgb(226, 232, 240)`, items `rgb(15, 23, 42)` at 12 px.
- dark: bar `rgb(11, 17, 32)`, border `rgb(36, 48, 73)`, items `rgb(231, 236, 243)`.
- vscode-light-modern: bar `rgb(248, 248, 248)`, border `rgb(229, 229, 229)`, items `rgb(59, 59, 59)`: VS Code's own statusBar values.
- mocha: `[h] YQ530VVFGK`, `[Y] main`, `v 0 ^ 16`, `/!\ 0`, `[:] unreachable`, `(%) ok`, `(s) up` | `[I] Ln 1, Col 1`, `>> Spaces: 4`, `[u] UTF-8`, `<- LF`, `{} YAML`, `[R] 4`, `[s] 0`, `(n)`; nothing reads as a separator. The Repositories view's branch rows draw `[Y]`.
- Found, outside L6: under mocha the Help view's first lines of the rail section, around its inline code, draw blurred over the wallpaper. Booked in Q69.

Theme and page put back to vscode-dark-modern and References.

## What is next

Q69 through /spec: the catalogue covered in one case, the owed light-theme looks, the earlier landings' unbooked items, the Help blur, and the seven landed steps checked against their briefs.
