# Q53 landing

Q53 repairs the shell drawing and hybrid touch defects and is booked in `plan.md`.

## Verification on main

- `npm test -- --reporter=dot`: 259 files and 4,380 tests passed.
- `npm run check`: 0 errors and 0 warnings.
- `npm run build`, `npm run format:check`, and `npm run lint`: passed.
- `LC_ALL=C grep -rna '[^ -~]' src tests`: printed nothing.
- `node bin/revert-check.mjs ...`: 9 red, 0 unproven, 156 unchanged cases unchecked.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ms-playwright-q53-q56 npx playwright test -c /private/tmp/main-playwright-isolated.config.mjs`: 269 passed.

## Look

Native Chrome opened Focus and Repositories on the page named TEST. Both views were readable with no overlap or clipping. The open Pane menu stayed above the gruvbox wallpaper and showed Close pane, Maximise pane, Move tab to page, Show a page here, Split tab right and Split tab down. The page and pane tab strips remained readable.
