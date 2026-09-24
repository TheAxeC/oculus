# L5 landing

## Open items, verbatim from the state file

- U1, the `glyph:` key on each theme row of `config/appearance.yml` (raised 2026-09-24 at U1's review; asked in chat the same day). The key names the icon drawn beside a theme in the Settings theme menu; a missing or unknown one is a finding and the entry is drawn with its words alone. Options: (a) keep the key, one line per theme, so each theme can carry its own icon; (b) no key: one fixed icon for the ordinary themes and another for the terminal themes, as the old characters did. Recommended (a): an icon per theme is a choice of the reader's, and the findings already hold it. (b) is the lazy option only in that it adds nothing.

Booked list: 2, carried for Q68 (the git watcher case that fails under load, queued after L6) and O32 (the launch recipes in the Ordo plan skills, waiting on the Ordo session).

## NOT DONE

- The look covered the rail under `vscode-dark-modern`, Axel's theme on the running cockpit. The light, dark and mocha themes were seen in the round reviewer's screenshots and are held by the browser cases; they were not looked at on the running cockpit.
- The catalogue's Open on this page and Open beside on this page were looked at as a menu on the Views and Settings page and not carried out there, since that page is Axel's; the browser cases carry them out.

## What landed

L5, cherry-picked from `.agents/worktrees/L5` at base `4b0a7ad5` onto main by `tools/oculus/.scratch/migration/land.sh L5 <base> <runs> --no-browser` (+4,032 -2,189 over 62 files), then fixed at landing (+211 -168 over 16 files) and the browser suite run by hand.

- The rail is VS Code's activity bar: 48 px wide, drawn in the ground's colour with a 1 px border on its right edge, as VS Code's Modern themes draw it. Items are icon-only, 48 px square, with a 24 px icon that stays fixed at every text scale. Icons are muted until hovered, and the page on screen draws in the text colour with a 2 px accent bar.
- One 16 px badge per item, inside it over the icon's lower right corner. It is drawn in the accent with its black or white, at 9 px in the UI face, and counts the first view of the page that counts anything.
- The name and digit are the tooltip, centred beside the item with an arrow. No tooltip opens during a drag, or on the focus a closing menu gives back.
- Drag a page button to reorder it. Right-click it (or press Shift+F10) for Hide and Settings. Both rewrite `rail:`, and History undoes either.
- The foot holds Bookmarks, Search and Update. Bookmarks is a menu of the bookmarks by name that rises from the star and scrolls when the window is too short. The BOOKMARKS group is gone from the list.
- The Views catalogue opens a view on its own page in three ways: drag an entry onto a pane, or right-click it for Open on this page or Open beside on this page. None of them covers the catalogue. A view already open in another pane of the page is activated where it is.
- `bin/revert-check.mjs` installs its signal handlers before its copy exists, so a run stopped during the copy leaves no folder behind.

## What was found

The first review found:
- badges in three colours;
- files outside the brief's paths;
- missing proofs;
- an orphaned token;
- eight visible differences from VS Code.

The repair round closed each. The run over the round found that the rail's own surface, derived in the round, did two things:
- it darkened every muted, accent and hue text under four themes;
- it moved the two VS Code themes away from VS Code, whose theme files draw the activity bar in the side bar's colour with a border.

**This corrects my report of the round:** the rail does not have a surface of its own. At landing it went back to the ground colour with its border, and `vscode-dark-modern` and `vscode-light-modern` now measure VS Code's `#181818` / `#2B2B2B` and `#F8F8F8` / `#E5E5E5`. The same run's other findings were also closed at landing:
- "Open beside" no longer moves an open view;
- a rising menu is capped at the space above it;
- the badge size has a directive;
- a duplicate contrast pair is removed;
- a test name and two comments are corrected;
- an edge drop on the catalogue's pane now has a case.

One difference from VS Code stays: the badge count is black on the blue under `vscode-dark-modern`, where VS Code draws white. Black reads at 4.64:1 and white at 4.53:1, and every accent fill follows that rule. Every finding and its end is under the Closed heading of `agents/reviews/L5-refuter.md`.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 292 passed (292); Tests 4648 passed (4648)
npm run check                       COMPLETED 1339 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
LC_ALL=C grep -rna '[^ -~]' src tests   prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npx playwright test                 354 passed (11.2m), after the last fix
node bin/revert-check.mjs           rail.spec 26 reverts 0 unproven; views.spec 16 reverts 0 unproven;
                                    revert-check.test 19 reverts 0 unproven; theme and contrast tests 4 reverts 0 unproven
revert-check.test signal case alone 1 passed, five runs of five
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
```

Not covered by these checks: a node run beside the browser suite once failed the git watcher case `tests/server/watch/git.test.ts:679`. It passes alone, 22 of 22 in three runs, and passed in the whole run above. It is booked as Q68.

## The look, on the running cockpit against VS Code

Under `vscode-dark-modern`, read from the page and zoomed:
- The rail is 48 px wide with 48 by 48 items, background `rgb(24, 24, 24)` and a 1 px `rgb(43, 43, 43)` inset border. These are VS Code's `activityBar.background` and `activityBar.border`.
- The four badges (52, 3, 1, 72) sit inside their items, 16 px high, in `rgb(0, 120, 212)` at 9 px. For a single digit they start 24 px from the item's left and 24 px from its top.
- Hovering Academic Life shows "Academic Life, key 3 (3 undecided)" beside the item with its arrow.
- The Bookmarks menu rises from the star, its bottom level with the star's, listing settings.json and the two manuals.
- A catalogue entry's right-click menu offers Open on this page and Open beside on this page.
- On the TEST page, which is on no rail button, no item shows the bar.

The cockpit was returned to the References page it was on.

## What is next

L6, the status bar drawn like VS Code's, from the P1 inventory.

## The look owed, done 2026-09-24 on the TEST page

Themes switched through the palette's `:theme` on TEST, then put back to `vscode-dark-modern` and the References page.

- light: rail `rgb(241, 245, 249)` with a `rgb(226, 232, 240)` border, the ground's colour; panes white; muted icons `rgb(95, 111, 133)` (`#5f6f85`, the value before the round's rail surface); the four badges `rgb(189, 93, 56)` with black, each inside its item; line icons.
- dark: rail `rgb(11, 17, 32)` with a `rgb(36, 48, 73)` border, the ground's colour; panes `rgb(18, 26, 43)`; badges inside their items; line icons.
- mocha: the rail translucent over the wallpaper (`color(srgb 0.118 0.118 0.180 / 0.76)`), the ASCII stand-ins, badges `rgb(245, 169, 127)` with black under the stand-in, inside the item.
- vscode-light-modern: rail `rgb(248, 248, 248)` with a `rgb(229, 229, 229)` border, VS Code's own values; badges `rgb(0, 95, 184)` with white.
- The catalogue opened on TEST (its pane the page's only one): right-click Help, Open on this page. Help opened in a new pane beside, but Help was already a tab of the catalogue's own pane, and that pane was left showing `settings.json` instead of the catalogue. The catalogue is covered in that case. Booked as Q69 with the other items of this audit.

