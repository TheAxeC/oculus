# T2a landing

Position: plan oculus/migration, step T2a (the deletion sweep of `tests/state/`) landed; next T2b, then T2d.

Open items: none.

Not done: nothing inside T2a.

- Steps 1: no builder or reviewer of T2a listed (ListAgents showed no subagent).
- Landed: 206 test files and 58,446 lines before, 8 test files and 1,118 lines after; 3,236 `it`/`test` calls before and 18 after. Kept tests named under G12, G28 and G29 in `agents/guarded.md`.
- Fixes at landing: the `allow-duplication.txt` conflict with T2c resolved to the lines both kept; `tests/server/machine/pty/tmux-fixture.ts` deleted (its only importer was deleted; `scratch.test.ts` failed); the clone 90416d85f4a4 between `board-fixture.ts` and `rail-badges-fixture.ts` entered in `allow-duplication.txt` (`duplication.test.ts` failed).
- Verify list on main from `tools/oculus`: npm test 199 files passed, 35 skipped, 3487 tests passed, 745 skipped; test:checks 30 files passed, 2 skipped, 412 tests passed, 33 skipped; `checks: 7 commands passed`.
- No look, no A/B.
- Usage: builder claude-sonnet-5-5 78,627 tokens, 103 tool uses, 17.9 min, round 1 146,586 tokens, 25 tool uses, 2.7 min; no brief check, no reviewer. The first report passed its bar; three fixes at landing.
