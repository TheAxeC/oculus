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

## Repair round 1, refuted (reviewer claude:opus adf0fa839f6739d7d, over the delta from 4da494a5)

### Verification (rerun by the reviewer)

```
$ sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md   (from .agents/worktrees/Q97/tools/oculus), exit 0
verify: 6 commands passed
$ git diff 4da494a5   -> tests/views/system/workbench/catalogue.test.ts only: the SHIPPED_RAIL_LABELS import removed; toEqual((config.rail as { label: string }[]).map((entry) => entry.label)); the Help-after-System check at :55 kept
Eight files, step layout: Test Files 8 passed (8) | Tests 138 passed (138)
Base layout: Test Files 7 failed | 1 passed (8) | Tests 10 failed | 128 passed (138), the same ten tests the report lists
Help rail line removed: Tests 10 failed, the views catalogue test among them ("+ Help" received)
info back to two panes: Tests 2 failed; help arrangement removed: Tests 9 failed; glyph question -> page: Tests 1 failed
app.yml:12 h1-h5, base: "... the Help group"; step: "... the Help page's group"
```

### 1. Spec

- None.

### 2. Proof

- None. The heading test fails with the Help rail line removed and on the base layout, and passes on the step layout.

### 3. Standards

- None.

### 4. Behaviour

- None. The key sheet's before and after match `git show` and `sed`.

### Not checked

- The look on screen.

Reviewer usage: 26 tool uses, about 9 minutes (550928 ms), 121266 tokens.

## Closed

- First review, Spec (no first run of the cases): closed in round 1; the report gives the first run and the reviewer reproduced it.
- First review, Proof (`catalogue.test.ts:51` green under the reverts): closed in round 1; the test now compares with `config.rail` and fails with the Help rail line removed.
- First review, Behaviour (`app.yml:12` before and after): closed in round 1; the report gives both.
- First review, Not checked, `settings.test.ts:136` "Remove button 11": no change needed. The case checks that each row's controls are named by the place of their button; with twelve rows the eleventh row's Remove is still named "Remove button 11", whichever button that is.
- Round 1, the report cites the Views catalogue test at `:51` where its `it(` is at `:50`: no change needed; the report is a record and the line is inside the test.
- The look: taken at landing.
