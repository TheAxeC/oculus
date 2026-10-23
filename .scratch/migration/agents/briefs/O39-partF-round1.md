# O39 part F, repair round 1

The rules file and `agents/briefs/O39-partF.md` still hold. This round closes the findings of `agents/reviews/O39-partF-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

The rules file's "Where you work" holds in full, as it stands until open item 263 is ruled: you run no git command, read-only ones included; the base copy `.agents/worktrees/migration-O39-partF-base/` is where the unchanged tree is read and run. No script or program is written to check a case; a case is checked by a test row the step has or by reading, and the report says which.

## Rulings

1. **Standards 1, the scrollbar rule held once.** The rule `* { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track) }` exists in one place, a new sheet `src/lib/ui/theme/scrollbar.css` with a head comment saying what it draws and who reads it. `src/routes/+layout.svelte` imports it beside the other sheets, and its `:global(*)` rule goes, with its comment moved into the sheet's head comment and made true. `src/hooks.server.ts` reads the sheet with `?raw`, as it reads `tokens.css`, and the ground element carries its rule in place of `GROUND_BAR`, which goes. `tests/server/root/hooks-server.test.ts` builds its expected element text from the same sheet, not from a copy of its own. Every ground row stays green; the rows' expected text changes only by what the sheet's text is.

2. **Spec 2 and Standards 3, the head comment of `src/lib/themes/parse.ts`.** It says that the ground is sent in a style element of its own, ahead of the head Kit fills, and that the page's first `applyTheme` takes that element away; and that `windowColours` returns the two colours that the host (`desktop/windows/start-colours.ts`) fills a window with, beside the buttons' symbol colour. Every other sentence of it stays true.

3. **Spec 1 and Behaviour 1, the report.** "Anything in the brief wrong or impossible" says that the two "sends no ground for an app's theme" rows and the C7 assertion passed on the unchanged tree, as expected for a behaviour the change keeps, so they have no failing run. "Before and after, for the look" gains a line for a page SvelteKit renders with its default error component (an unmatched path, a failed load): before, white first frames under the dev server; after, the start ground from the first frame, the element kept for the page's life.

4. **Standards 2, the withheld-block guard.** No change. The guard `sheet === null || sent` and its row stay: the brief's item 2 and C6 ask for them, and without the guard a withheld app block would be sent with that app's ground, a dark frame under a light page.

5. After this round's last change the verify list runs once (`npm run diagrams && npm run test:quick -- <the changed paths>`), and the report says how many times it ran.

## Paths this round writes

Every path of `agents/briefs/O39-partF.md`'s "Paths this step writes", the one the first report named outside it (`src/lib/shell/window/appearance.svelte.ts`), and:

- `src/lib/ui/theme/scrollbar.css` (new)
- `src/routes/+layout.svelte` (whole)
- `.scratch/migration/agents/reviews/O39-partF-report.md` (a section "# Repair round 1" appended)

## Report

Append "# Repair round 1" to `.scratch/migration/agents/reviews/O39-partF-report.md`: each ruling with DONE or NOT DONE, its diff and the check that shows it; each changed test row with its run after the change; the verify lines.
