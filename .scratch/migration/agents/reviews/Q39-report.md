# Step Q39 builder report

Everything in the brief is done

## The reverts and results

I applied each revert only in the scratch copy `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q39-builder/oculus`, using `revert.py` and `run.sh` in the same folder. For each revert, `run.sh` puts the three strip source files back from the worktree, copies in the worktree's final spec files, applies the revert (it asserts the replaced text occurs the expected number of times), runs `npm run build`, then runs `npx playwright test tests/browser/shell-defects.spec.ts tests/browser/pages.spec.ts -g "tabs|overflowing page strip"`. The matrix below comes from the last run with the final spec files (`matrix-final.txt`, `out-<revert>.txt`).

The reverts:
- **step-fixed:** `tabEdgeStep` returns `scrollLeft + direction * 40`.
- **reveal-noop:** `return;` at the top of `reveal`.
- **resized-no-reveal:** `resized` ends with `shownWhole = showingWhole(list);` and does not reveal.
- **resized-no-measure:** the `measure()` call is removed from `resized`.
- **wheel-settle-now:** `wheel` calls `restAt(<nearest tab start>)` straight after scrolling.
- **wheel-settle-later:** the same settle runs 150 ms after the last wheel event.
- **delta-x-only:** `horizontalWheelDelta` returns `deltaX`.
- **hidden-true:** both controls get `hidden={true}`.

With no revert, all 9 cases pass. R = red, g = green, and "(line N)" is the line the red case failed on. The `line` column is the case's line in the final spec file.

| Case | line | step-fixed | reveal-noop | resized-no-reveal | resized-no-measure | settle-now | settle-later | delta-x-only | hidden-true |
|---|---|---|---|---|---|---|---|---|---|
| tenth tab at strip end, right control disabled | 434 | g | **R** (439) | g | g | g | g | g | **R** (442) |
| scroll control lands on a tab start or the end | 445 | **R** (459) | g | g | g | g | g | g | **R** (452) |
| trackpad scrolls freely, stays put | 476 | g | g | g | g | **R** (488) | **R** (490) | g | g |
| vertical wheel notch scrolls by its travel | 493 | g | g | g | g | **R** (497) | **R** (497) | **R** (497) | g |
| widening hides the controls | 500 | g | g | g | **R** (521) | g | g | g | **R** (509) |
| tab from the rail brought in whole | 528 | g | **R** (538) | g | g | g | g | g | g |
| narrowing 900 to 640 keeps the tab whole | 546 | g | **R** (555) | **R** (557) | g | g | g | g | g |
| narrowing 720 to 560 keeps the tab whole | 546 | g | **R** (555) | **R** (557) | g | g | g | g | g |
| page strip: control rests on a page tab start or the end | pages 161 | **R** (193) | g | g | g | g | g | g | **R** (175) |

Every case turns red under at least one revert that targets it.

## Case tightened

One case needed it: the widening case (shell-defects.spec.ts:500).
- **Before:** it stayed green under resized-no-measure (first matrix run: 9 passed). The old case widened only from where `tenTabs` leaves the strip, at its end. Widening there makes the browser pull the offset back to 0, which fires a scroll event, and `scrolled()` measures the strip again. That hid the missing `measure()` in `resized`.
- **After:** the case widens twice, each time from 720 px:
  - from the strip's start (reached with `toStart`), where widening moves nothing and fires no scroll event;
  - from its end (right control pressed until disabled, with a poll that each press moves the strip and that it ends at the end).
- **Result:** red under resized-no-measure at line 521 (`expect(right).toBeHidden()`), green on the unchanged source. The output does not say which of the two loop passes failed.

## New page-strip case

`tests/browser/pages.spec.ts`, describe "an overflowing page strip":
- Viewport 480 x 640, and 12 pages made through the page menu. The case asserts both scroll controls are visible.
- It then walks right to the end, left to the start, and right to the end again. After every press it polls that the offset changed, then asserts the left edge is a page tab's start or the strip's end.
- The second and third walks must each take at least 2 presses, so at least one rest lies between the two ends. The final offsets are checked at 0 and at the end.
- The first walk has no minimum, because it starts wherever the newest page left the strip. This keeps the case independent of `reveal`, and it stays green under reveal-noop.

## Verification (from tools/oculus in the worktree)

- `npm run check`: `COMPLETED 1170 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- The ASCII perl gate over src, tests, bin and config prints nothing. `LC_ALL=C grep -n '[^ -~]'` over the two spec files prints nothing (exit 1).
- `npm run build`: exit 0
- `npx playwright test tests/browser/shell-defects.spec.ts tests/browser/pages.spec.ts tests/browser/tabs.spec.ts`: `31 passed (30.2s)`
- `npx vitest run --reporter=dot`: `Test Files 233 passed (233)`, `Tests 3923 passed (3923)`
- `git status --short`: only the two spec files are modified.

## Files changed (`git diff --numstat`)

- `tools/oculus/tests/browser/pages.spec.ts`: +65 -2 (the new describe, the `Locator` import, one clause added to the head comment)
- `tools/oculus/tests/browser/shell-defects.spec.ts`: +21 -6 (the widening case)

## Decisions you may reverse

- **Fixed step of 40 px.** A step that happened to match every tab's width would not be caught. At the widths used here it was caught in both cases that press the controls.
- **Two versions of "settle to the nearest tab start".** I ran both an immediate settle and one 150 ms later. Both turn the trackpad and vertical-notch cases red.
- **Page strip at 480 px with 12 pages.** I chose this size so the strip overflows by several page tabs.

## Limitations

- **Narrowing cases under reveal-noop:** they fail at line 555, while Map is being brought in and before the window narrows. So the narrowing step itself is proven only by resized-no-reveal (line 557).
- **hidden-true reds:** in the three cases that find the controls through `getByRole`, the red comes from the locator not matching hidden controls:
  - line 442, `toBeDisabled` found no control;
  - line 452, `isDisabled` ran for the 30 s test timeout;
  - line 175, `toBeVisible` in the page-strip case.
  
  They are red, but through the controls disappearing from the accessibility tree, not through a disabled-state check.
- **Other browser runs on port 8792:** twice another run held the port during my runs, and `run.sh` now waits for it to be free. I never touched the lock or its process.
- **Scratch copy:** it is still in the scratchpad folder, including its build and test-results.
