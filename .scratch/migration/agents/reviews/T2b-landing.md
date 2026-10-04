# T2b landing

Position: plan oculus/migration, step T2b (the deletion sweep of `tests/server/`) landed; next T2d.

Open items: none.

Not done: nothing inside T2b.

- Steps 1: no builder or reviewer of T2b listed (ListAgents showed no subagent).
- Landed: 139 test files and 47,452 lines before, 38 test files and 4,474 lines after; 2,150 `it`/`test` calls before and 98 after. Kept tests named under G1 to G4, G7 to G11, G28, G30, G31 and G33 to G35 in `agents/guarded.md`.
- Fixes at landing: the `allow-duplication.txt` conflict resolved; `deck-edit.test.ts`'s leftover fragment of `NEITHER` deleted (parse error); two stale `allow-duplication.txt` entries deleted; `channel.test.ts`'s dead `instanceof Error` branches deleted and four variables made `const`; `ops-fixture.ts` reformatted; two unused names deleted.
- Verify list on main from `tools/oculus`: npm test 114 files passed, 19 skipped, 1837 tests passed, 183 skipped; test:checks 30 files passed, 2 skipped, 412 tests passed, 33 skipped; check 0 errors; `checks: 7 commands passed`.
- No look, no A/B.
- Usage: builder claude-sonnet-5-5 296,409 tokens, 188 tool uses, 28.6 min, round 1 306,466 tokens, 105 tool uses, 18.9 min, round 2 292,468 tokens, 6 tool uses, 1.0 min. The first report did not pass its bar; six fixes at landing.
