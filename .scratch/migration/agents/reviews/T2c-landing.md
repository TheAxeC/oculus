# T2c landing

Position: plan oculus/migration, step T2c (the deletion sweep of `tests/views/`, `tests/shell/`, `tests/ui/`, `tests/themes/`) landed; next T2a, then T2b, then T2d.

Open items: none.

Not done: nothing inside T2c.

- Steps 1: no builder or reviewer of T2c listed (ListAgents showed only T2b's builder, completed).
- Landed: 194 test files and 52,175 lines before, 2 test files and 329 lines after; 2,755 `it`/`test` calls before and 3 after. Kept: G5 `tests/ui/html.test.ts` (one case), G28 two cases of `tests/shell/panes/strip/tab-menu.test.ts`, named under their entries in `agents/guarded.md`.
- Fix at landing: 107 entries of `tests/checks/tree/allow-audits.txt` named deleted cases and failed `audits.test.ts`; removed.
- Verify list on main from `tools/oculus`: npm test 395 files passed, 37 skipped, 9119 tests passed, 752 skipped; test:checks 30 files passed, 2 skipped, 412 tests passed, 33 skipped; `checks: 7 commands passed`.
- No look, no A/B.
- Usage: builder claude-sonnet-5-5 213,508 tokens, 60 tool uses, 7.0 min; no brief check (Z401), no reviewer (Z402). The first report passed its bar; one fix at landing.
