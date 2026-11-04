# O141, round 0: the ruling on the hand-back

Axel ruled open item 672 (a) on 2026-11-04 (`plan.md` Rulings, "Open item 672"). Your hand-back stands: run A and run B are accepted as the first run of the cases, and the step goes on under the brief as this file changes it. Everything of the brief not named here holds unchanged.

## What changes in the brief

1. Item 3's bar 3 and decision 3 ("A colour change takes a tone `palette:` already maps, so no theme needs a new token") are replaced. A theme block may now change: where two hues that lane or band headers are drawn in alias (dracula's `--c-blue`, `--c-slate` and `--c-grey`, all `#6272a4` at `src/lib/themes/rice/singles.css:97,106,107`) or sit under a CIEDE2000 of 10 on their `-lane` surfaces in that theme (kanagawalotus's gold and grey-d, 4.9), the block gets hues of its own. Lane recolours in `config/catalogs/vocab.yml` under item 3's value forms remain allowed where they help. Choose the change that ends each failing pair with the fewest theme hues changed, and prefer a theme hue over a lane recolour where a lane recolour would break bar 2 elsewhere.
2. After the change, in every one of the 49 themes:
   - bar 1: no open-layout pair is under 10;
   - bar 2, kept as the brief states it: a pair at 10 or more on the base stays at 10 or more, a pair under 10 on the base does not get closer, and the count of collapsed-only pairs under 10 in at least one theme does not grow;
   - each theme hue you change is at 10 or more against every status token of its theme, on the hue and on its derived `-txt`, measured as O140's case-run program measures (`agents/reviews/O140-report.md`, the status tokens read from `statuses:`), and O140's program run on the worktree still prints `0 pairs under 10`;
   - `tests/checks/look/contrast.test.ts` passes, so each changed hue keeps the text contrast the test checks.
3. Each theme file you touch has its head comment name where its added or changed hues come from, as O140 did for its blocks (the theme's own published palette where it has one, and otherwise the rule you used, in one plain sentence).
4. Item 4 is unchanged: the three comments are rewritten to the final run.

## Paths this step writes, widened

Added to the brief's list:
- `src/lib/themes/rice/*.css`, the blocks and head comments you change
- `src/lib/themes/themes.css`, the blocks and head comments you change
- `src/lib/themes/vscode.css`, the blocks and head comments you change
- any sentence of `docs/`, `README.md` or a head comment that names a theme hue you change and that the change makes false (`grep -rn` for each changed hex and token name over `docs README.md src config --exclude=local.yml`)

## Cases, changed and added

- C3 now also reads: every collapsed-only pair meets bar 2 with the theme hues changed.
- C5 now reads: `diff` of `vocab.yml` against the base copy shows only the colour lines item 3 changes and lines 181 and 213 (and O143's lines 145-147 that main already holds are not yours); `diff` of `derive.ts` shows only lines 83-89; `diff` of each touched theme file shows only the changed hue lines and its head comment.
- C11. For every theme hue changed: the program prints its old and new value and its nearest status token on the hue and on `-txt`, each at 10 or more.
- C12. O140's case-run program, run from the worktree after the change, prints `0 pairs under 10`.

## The report adds

- Each theme hue changed: theme, token, old and new value, the pairs it ends, and its other users on screen (status chips, the git graph, the calendar, any other reader you find with `grep -rn -- '--c-<hue>'`), so the look at landing can open each.
- The case-run program's source as changed, and every run after the change.
