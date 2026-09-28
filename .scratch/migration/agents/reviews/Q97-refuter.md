# Step Q97 refuter report (on .agents/worktrees/Q97, base 4e33d99e)

## Verification (rerun by the reviewer)

```
$ sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md   (from .agents/worktrees/Q97/tools/oculus), exit 1
RED: npm test
 FAIL  tests/server/core/git.test.ts   Error: Hook timed out in 10000ms.
 FAIL  tests/server/git/git-ops.test.ts   Error: Hook timed out in 10000ms.
 FAIL  tests/checks/imports/order.test.ts > the folder order of each layer > holds the state folders   Error: Test timed out in 5000ms.
 Test Files  3 failed | 338 passed (341)
      Tests  3 failed | 5355 passed (5358)
$ npx vitest run tests/checks/imports/order.test.ts   -> Tests 13 passed (13)
npm run check -> 0 errors; npm run build -> 0; npm run format:check -> clean; npm run lint -> 0; ASCII grep -> 0; spec perl ASCII gate -> nothing
$ grep -c "label:" <(sed -n '/^rail:/,/^$/p' config/layout.yml)   -> 12
$ grep -n "no page" (the four files) -> config/layout.yml:44 only, not about the Help group
Revert checks in a scratch copy:
 (a) base layout.yml: settings, state catalogue, arrangement, rail-config, config-folder fail; tests/views/system/workbench/catalogue.test.ts PASSES
 (b) Help rail line removed: views catalogue passes, state catalogue fails; twelve-pages, glyph and config-groups tests fail
 (c) info back to two panes: pane by pane and exactly-one-page fail
 (d) help arrangement removed: config-groups fails
 (e) Help glyph question -> page: the glyph test fails
```

git.test.ts and git-ops.test.ts are outside the step (spec.md, "Verify before you report").

## 1. Spec

- Q97-report.md, "The cases' first run": no case's first run is given; the report says the previous builder ran it and does not restate it. The first line "Everything in the brief is done" is therefore false.

## 2. Proof

- `tests/views/system/workbench/catalogue.test.ts:51`: the report says it turns red when the Help rail entry is removed; it stays green under reverts (a) and (b), since it compares the drawn headings with the constant `SHIPPED_RAIL_LABELS` and the view orders its headings by `nav_groups`, where `help` follows `info` before and after the step. Fix: compare with the loaded config's `rail` labels, as the state test does.

## 3. Standards

- None.

## 4. Behaviour

- `config/text/app.yml:12`: the key sheet's `h1-h5` row now ends "the Help page's group"; the report gives no before and after for it.

## Not checked

- The look on screen (the Help button's tooltip digit, the Help page as drawn).
- `tests/views/system/workbench/settings.test.ts:136` asserts "Remove button 11", which now is Help rather than Views and Settings; still passes, intent not judged.

Reviewer usage: 20 tool uses, about 15 minutes.
