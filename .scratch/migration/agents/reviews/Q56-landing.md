# Q56 landing

Q56 adds retry controls for failed Files reads, watches the bookmarks file, and is booked in `plan.md`.

## Verification on main

- `npm test -- --reporter=dot`: 263 files and 4,395 tests passed.
- `npm run check`: 0 errors and 0 warnings.
- `npm run build`, `npm run format:check`, and `npm run lint`: passed.
- `LC_ALL=C grep -rna '[^ -~]' src tests`: printed nothing.
- `python3 -c "import yaml; yaml.safe_load(open('config/text/views/files.yml'))"`: exited 0.
- `node bin/revert-check.mjs ...`: 24 red, 0 unproven, 155 unchanged cases unchecked.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ms-playwright-q53-q56 npx playwright test -c /private/tmp/main-playwright-isolated.config.mjs`: 271 passed.

## Look

Native Chrome opened Files on the page named TEST. The hub, engine, cathedra and game-engine roots were aligned and readable. Bookmarks and Notes showed their empty rows, and Workspaces showed Configured roots. The section heads, counts and rows had no overlap or clipping. The reviewed candidate look also covered the controlled failure state: roots, Bookmarks, Notes and Workspaces each showed their failure row, and every list failure carried its `read again` control.
