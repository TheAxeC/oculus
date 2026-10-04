# T2d landing

Position: plan oculus/migration, step T2d (the deletion sweep of `tests/routes/`, `tests/data/`, `tests/checks/`, `tests/fixtures/`) landed, the last of the four sweeps; next T2e (booked), then Q117, then T1a.

Open items: none.

Not done: nothing inside T2d. Left outside every sweep's brief and booked as step T2e: the units two sweeps each kept a test for, and 28 references to deleted test files in comments and `DESIGN.md`.

- Steps 1: no builder or reviewer of T2d listed (ListAgents showed no subagent).
- Landed: 117 test files and 34,741 lines before, 65 test files and 12,966 lines after; 1,577 `it`/`test` calls before and 340 after. The whole of `tests/` after the four sweeps: 113 test files, 18,887 lines, 459 calls. Every entry of `agents/guarded.md` names a test.
- Fixes at landing: `allow-audits.txt` deleted to resolve the modify/delete conflict; the unused import `options` in `tests/routes/sessions/terminal.test.ts` deleted (lint).
- Verify list on main from `tools/oculus`: npm test 80 files passed, 17 skipped, 185 tests passed, 68 skipped; test:checks 15 files passed, 1 skipped, 224 tests passed, 3 skipped; check 0 errors; `checks: 7 commands passed`.
- No look, no A/B.
- Usage: builder claude-sonnet-5-5 337,205 tokens, 310 tool uses, 50.4 min, round 1 268,310 tokens, 100 tool uses, 15.3 min. The first report passed its bar; two fixes at landing.
