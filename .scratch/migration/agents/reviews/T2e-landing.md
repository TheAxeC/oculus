# T2e landing

Position: plan oculus/migration, step T2e (the sweeps' leftovers, with Q117's record-file refusals) landed. Next: T1a (the test tiers).

## Open items

None.

## Not done

Nothing in the brief.

## What landed

- The second test of each of the brief's 34 pairs deleted, eight files left with no test deleted, the stale test-file references in comments and `DESIGN.md` and the four false git-gate comments removed.
- `readJsonChecked` (`src/lib/server/core/json.ts`), used by the saved commands, approvals, workspaces and session overrides files.
- A write over a workspaces file or a session overrides file that does not read is refused with `<file name> <reason>: <path>`, the file left as it was; `setFlag`'s refusals now reach the session write's answer.
- A saved layout that `parseLayout` cannot read is kept under `oculus.layout.unread` before the default is written over it.
- The bookmarks writers already leave an unparseable file as it was (`src/lib/server/edit/writes/entries.ts:235-266`); no code changed there.
- Five new tests, each quoted failing on the unchanged tree in `T2e-report.md`, named under G31 in `agents/guarded.md`. Every deleted test named in `agents/guarded.md` replaced by its kept twin.
- `tests/`: 113 test files, 18,887 lines, 459 `it`/`test` calls before; 108, 18,252 and 432 after.

## Known limit

The page says the workspaces refusal through `files.refused_other` ("The server refused that: {0}"), with the reason as `{0}`.

## Look and A/B

No look: the only change a reader sees is the refusal over a workspaces or overrides file that does not read, which TEST shows only over Axel's own `~/.oculus` files corrupted. No A/B (no `bench:`).

## Agents

Builder claude-sonnet-5-5 (ordo-high), 207,569 tokens, 189 tool uses, 35.9 min. No brief check, no reviewer, no repair round (Z416). The first report passed its bar. No fix at landing.

## Verify list on main

Verify list on main from `tools/oculus`, after `npm run diagrams`: npm test 76 files passed, 16 skipped, 171 tests passed, 55 skipped; test:checks 15 files passed, 1 skipped, 224 tests passed, 3 skipped; check 2772 files, 0 errors, 0 warnings; build, format:check, lint and the ASCII grep clean; `checks: 7 commands passed`.
