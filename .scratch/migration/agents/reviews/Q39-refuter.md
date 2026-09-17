# Step Q39 refuter report (on .agents/worktrees/q39, base d5f1ce02)

No finding blocks landing. The two points under Proof are about gaps in the builder's report, not defects in the tests.

## Verification (rerun by the reviewer)
All commands ran from `tools/oculus` in the worktree.
- `npm run check`: `COMPLETED 1170 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- ASCII perl gate over src, tests, bin and config: printed nothing, exit 0
- `npm run build`: exit 0
- `npx playwright test tests/browser/shell-defects.spec.ts tests/browser/pages.spec.ts tests/browser/tabs.spec.ts`: `31 passed (39.3s)`. The report says `31 passed (30.2s)`. The count matches; only the time differs.
- `git status --short`: only `tests/browser/pages.spec.ts` and `tests/browser/shell-defects.spec.ts` are modified.

**How the reverts were run.** I used my own copy of `tools/oculus` in `scratchpad/q39-review/oculus`, with my own `revert.py` and `run.sh`. Each run restores the strip's source files and both spec files from the worktree, applies one revert (its text is asserted to occur the expected number of times), runs `npm run build`, then runs `npx playwright test tests/browser/shell-defects.spec.ts tests/browser/pages.spec.ts -g "tabs|overflowing page strip"`. With no revert: 9 passed.

| Case (line) | step-fixed | resized-no-measure | old widening case + no-measure | hidden-true | reveal-noop | resized-no-reveal | disabled-false | reveal-nearest-edge | delta-x-only |
|---|---|---|---|---|---|---|---|---|---|
| page strip (pages 161) | R 193 | g | g | R 175 | g | g | R 191 | g | g |
| tenth tab (434) | g | g | g | R 442 | R 439 | g | R 442 | g | g |
| control lands (445) | R 459 | g | g | R 452 (30.1 s) | g | g | R 457 | g | g |
| trackpad (476) | g | g | g | g | g | g | g | g | g |
| wheel notch (493) | g | g | g | g | g | g | g | g | R 497 |
| widening (500) | g | R 521 | **g** | R 509 | g | g | R 516 | g | g |
| rail (528) | g | g | g | g | R 538 | g | g | R 539 | g |
| narrow 900 to 640 (546) | g | g | g | g | R 555 | R 557 | g | R 558 | g |
| narrow 720 to 560 (546) | g | g | g | g | R 555 | R 557 | g | R 558 | g |

Two of these reverts are not in the builder's set:
- **disabled-false:** both controls set to `disabled={false}` (`src/lib/ui/Tabs.svelte:228` and `:324`).
- **reveal-nearest-edge:** `revealOffset` returns the current offset if the tab is already whole, otherwise the smallest scroll that brings it in whole (`target.start`, or `target.end - width`, clamped to 0 and the strip's end).

"Old widening case + no-measure" is the diff's change to `shell-defects.spec.ts` undone with `patch -R` (the log shows the old line numbers 513 and 531), under resized-no-measure.

## 1. Spec
none.
- The page-strip case (`pages.spec.ts:161-201`) does what brief item 1 asks: 12 pages at 480 x 640, right presses to the end, then left presses to the start, each press checked to rest on a page tab's start or the strip's end.
- The eight tab cases were each run under reverts that target them. The one case that stayed green under its revert was tightened, and the source was not touched.
- Nothing outside the two spec files was edited.

## 2. Proof
- **`tools/oculus/.scratch/migration/agents/reviews/Q39-report.md:76-82` (disabled state).** The report's only revert that touches the controls is hidden-true, and it admits those reds come from the locator no longer matching. So the report leaves the disabled state unshown. The smallest revert that shows it is disabled-false. Under it:
  - the tenth-tab case fails at `shell-defects.spec.ts:442` (`toBeDisabled`) on a locator that still resolves;
  - the control case fails at `:457`, the widening case at `:516`, and the page-strip case at `pages.spec.ts:191`.

  The tests do prove the disabled state; the report's revert set does not show it.
- **Same report, "a start at the left edge".** The report never shows that part of the rail case and the narrowing cases:
  - reveal-noop fails them before that check (at 538 and 555);
  - resized-no-reveal fails the narrowing cases at 557, the whole-tab check.

  reveal-nearest-edge turns them red at `shell-defects.spec.ts:539` and `:558`. The property is proven; the report did not show it.
- **The narrowing step itself** is proven by resized-no-reveal at `:557`, after the window narrows. I reproduced this.
- **The widening case (`shell-defects.spec.ts:507-525`).** The old form stays green under resized-no-measure (9 passed); the new form fails at `:521` (`toBeHidden`). The run took 5.9 s, which is one expect timeout, and the loop runs the start pass first. So the red comes from the start pass, and the end pass is not reached under this revert. That is expected: the end pass is the old scenario, which was green under this revert.
- **The page-strip case** stays green under reveal-noop and reveal-nearest-edge. This is consistent with its comment: it covers only the controls.
- **Tolerances:** none widened. `rest` uses the same 1 px slack as `edge`, and the widening check keeps `toBeLessThanOrEqual(1)`.
- **The report's red lines:** every one I ran reproduces: 193, 459, 521, 175, 442, 452 (30 s), 509, 439, 538, 555, 557, 497.

## 3. Standards
- **`tests/browser/pages.spec.ts:149-159`:** `rest` repeats the tab-start / strip-end test from `edge` in `tests/browser/shell-defects.spec.ts:384-400`, with the same 1 px slack. A shared helper would need a third file under `tests/browser`, which brief decision 1 rules out. It is booked here for the orchestrator; it is not a defect of the builder.
- **Comments:**
  - `pages.spec.ts:145` says 12 pages at this width run "several page tabs past its width". A probe in my copy measured scrollWidth 1061, clientWidth 276 and page tabs 83-92 px wide. That is about 785 px, or nine tabs, of overflow, so the comment is true.
  - The probe also showed the strip opens at offset 785, its end, so the first walk takes no press, as the comment at `:178-181` says.
  - The widening comment at `shell-defects.spec.ts:505-506` is borne out by the old case staying green and the new one turning red under resized-no-measure.
  - The head comment at `pages.spec.ts:1-3` is true. The head comment of `shell-defects.spec.ts` is unchanged and still true.
- History in comments: none. Non-ASCII: none (gate clean).

## 4. Behaviour
none. `git diff d5f1ce02` touches only the two spec files, and no file under `src/` or `config/` changed. My copy with no revert passed all 9 cases.

## Not checked
- The wheel-settle-now and wheel-settle-later reverts were not rerun. The report's reds at 488/490 and 497 for them are not reproduced.
- `npx vitest run` was not rerun (the report says 3923 passed).
- `tests/browser/tabs.spec.ts` was not run under any revert.

Reviewer usage: about 25 tool uses, about 17 minutes.

## Closed

- Proof, the disabled state and the start at the left edge: the reviewer's own reverts (disabled-false, reveal-nearest-edge) turn the cases red, so both properties are proven by the tests as they stand; the builder's report lacked those two reverts, and this report records them. Nothing to change.
- Standards, `rest` in `pages.spec.ts` repeating `edge` of `shell-defects.spec.ts`: the brief confined the step to the two spec files; a shared helper under `tests/browser/` is left for Q38, which redraws the tab and page strips and rewrites those cases.
- The wheel-settle reverts were not rerun by the reviewer; the builder's reds for them stand as reported.
