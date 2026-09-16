# Step Q33 refuter report, third review (on .agents/worktrees/q33, base 133e7c39)

Two defects are open, both in the tab strip's new scroll code, and neither has a test:
- **Widening the window when the strip is at its end** leaves the left edge off a tab's start.
- **Widening the window until every tab fits** leaves the scroll controls showing and the strip still scrollable. Main does not do this.

Details are under Spec 1 and Behaviour 1. Nothing was written in the worktree or the main checkout: `git status --short` lists 34 paths (30 modified, 4 untracked), the same as at the start. Probes ran in APFS clones under `scratchpad/q33-review3/` with no symlinks. The clones are deleted; the logs and the probe specs are still there.

## Second review's findings
- **Spec 1, the strip's end off a tab's start: partly closed.**
  - Closed where the strip reaches its end by opening, by a control press or by closing a tab. Ten tabs at 720 px rest at 1036, which equals max and is tab 8's start; the tail is 102.3 px. Pressing right goes 623 to 815 (max), and the right control is then disabled. Closing three tabs at the end left the strip on a start each time.
  - Still open when the window gets wider at the end: see Spec 1.
- **Spec 2:** no finding then, none now.
- **Proof 1, the reveal not proven on its own: closed.** I reran R7 and R8, and both went red: `shell-defects.spec.ts:553` for R7, and `:572` in both "narrows" cases for R8.
- **Proof 2, the control step not proven on its own: closed.** I reran R2 (`scrollBy` of the first tab's width): red at `shell-defects.spec.ts:471` and `tabs.spec.ts:61`.
- **Proof 3, the edge check accepting max - 1: closed.** `shell-defects.spec.ts:390-392` and `tabs.spec.ts:28-31` no longer accept it.
- **Standards 1** (`+layout.svelte` comment): closed (`:27-31`).
- **Standards 2** (Tabs.svelte head comment): rewritten, but the new sentence is false in one case (Standards 1 below).
- **Standards 3** (`colours.test.ts:6`): closed, it reads "seven".
- **Standards 4** (`tabs.spec.ts` title): closed.
- **Standards 5** (Doc text): the VS Code justification is gone. "rests only with a tab's start" is still false after a widening, and a new false clause was added (Standards 1 and 2 below).
- **Standards 6** (Limitations): closed. The tail and pauses over 300 ms are stated.
- **Behaviour 1, the settle fighting a pause: closed.** Gaps of 202, 283 and 282 ms caused no settle during the pause and no backward step.
- **Behaviour 2, one notch doing nothing: closed for pixel wheels.** A deltaY of 100 goes 105 to 207 (real `page.mouse.wheel`). Still open for a line-mode notch: Behaviour 3 below.
- **Behaviour 3, the 16 px last press: closed** (see Spec 1 above).
- **Behaviour 4, resize reveals only a crossed tab: closed.** The R8 revert goes red.
- **Behaviour 5, thumb contrast: closed.** Thumb on track now runs 3.00 (vscode-dark-modern) to 3.26 (synthwave). Light 3.12 (`#8593a7` on `#fff`), dark 3.13, solarized 3.06. Printed by a vitest probe over `deriveTokens`.

## Verification (rerun by the reviewer)
All from `tools/oculus` in q33:
- **Node tests:** `npx vitest run --reporter=dot` gave `Test Files 229 passed (229)`, `Tests 3835 passed (3835)`. No timing flake.
- **Type check:** `npm run check` gave `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- **Build:** `npm run build` exit 0.
- **Format:** `npm run format:check` gave `All matched files use Prettier code style!`
- **Lint:** `npm run lint` exit 0.
- **ASCII gate (perl form):** printed nothing.
- **File lengths:** the tail is `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`. Tabs.svelte is 490 lines, tab-strip.ts 166, tab-scroll.svelte.ts 193, ActivityRail.svelte 518.
- **Browser suite:** `npx playwright test` gave `153 passed (2.8m)`.

Report figures:
- **Reproduced:** ten tabs at 720 px give `at 1036 = max`, tail 102.3. The thumb ratios reproduced as listed above.
- **Reverts rerun, one per copy, each built:** R1 (`tail = 0`), R2, R4 (`SETTLE_MS = 120`), R6 (`GESTURE_MIN = 0`), R7 and R8 all turned their named tests red.
  - R1 was red at `shell-defects.spec.ts:452`, `:476` and `tabs.spec.ts:54`.
  - R4 was red at `:507`, and R6 at `:540`.
- **Node reverts, which the report had not run:**
  - `GESTURE_MIN = 0` turns two cases in `tests/ui/tab-strip.test.ts` red.
  - Removing `readable(..., SCROLL_THUMB_RATIO)` turns red the contrast thumb test (light 2.25 to solarized 1.70) and the first-paint test.

## 1. Spec
1. **The rest-on-a-start rule fails after a window widens while the strip is at its end** (`src/lib/ui/tab-scroll.svelte.ts:116-124`).
   - **Cause:** `resized()` only reveals when the showing tab stopped being whole. It never puts the offset back on a start. The browser clamps `scrollLeft` to the old scroll width minus the new width, and the tail is then re-measured larger.
   - **Measured, 9 tabs, strip at its end:**

     | Window | Offset after | Max after | Left sliver |
     |---|---|---|---|
     | 720 to 760 px | 775 | 815 | 38 px |
     | 720 to 800 px | 735 | 815 | 78 px |
     | 720 to 1000 px | 535 | 623 | 86 px |

   - The strip does not rest on a tab start at any of those widths. In an earlier run, 720 to 800 px also left the right control disabled with 40 px still to scroll, from a stale `atEnd`.
   - **On main:** the same resizes leave slivers of 116 to 164 px, so this is not a regression. It is the ruling not met at this position.
2. **The move of the scroll code into `ui/tab-scroll.svelte.ts`:** no finding.
   - It is justified by the spec's "a component under about 600, split by responsibility": Tabs.svelte had reached 578 lines.
   - It is disclosed in the report, holds its state per strip (`createTabScroll` closure, `:61-74`), imports only `svelte` and `ui/tab-strip`, and passes `boundaries.test.ts`.
3. **User-visible decision not booked:** the page strip (`shell/PageStrip.svelte:277` uses `Tabs`) gets the same tail, snapping and settle. Measured with 14 pages at 720 px: tail 52.1 px, resting at max 785. The reports and the Doc text describe only a pane's tab strip.

## 2. Proof
1. **No test widens the window.** The two resize cases (`shell-defects.spec.ts:557-575`) only narrow it, so neither Spec 1 nor Behaviour 1 can turn a test red.
2. **Whether `preventDefault` takes effect is not tested; I measured it instead.**
   - The specs dispatch synthetic `WheelEvent`s, which never scroll natively. `tabs.spec.ts:69` polls only `> beforeWheel`, which a double scroll would also pass.
   - CDP `DOMDebugger.getEventListeners` on the tablist gives `wheel passive:false`.
   - A real `page.mouse.wheel(40, 0)` over the strip gave `defaultPrevented: true` and `scrollLeft` 40, not 80.
   - `page.mouse.wheel(0, 100)` moved the strip 105 to 205, then it settled at 207. `window.scrollY`, the document and the pane's `[data-scroll]` stayed at 0.
3. **The settle timer is never exercised after the strip closes.** `dispose` (`tab-scroll.svelte.ts:178-181`, called from `Tabs.svelte:100`) has no test, although the spec rule asks for an asynchronous path to be exercised after close.
4. **Other checks:**
   - no test asserts a defect;
   - no widened predicate;
   - no module-level mutable state: `SETTLE_MS` and `GESTURE_MIN` are constants, `FADE_SLACK` too.

## 3. Standards
1. **The rest-on-a-start sentences are false after a widening at the strip's end** (Spec 1):
   - `src/lib/ui/Tabs.svelte:19`: "An overflowing strip rests only with a tab's start at its left edge, its end included";
   - `src/lib/ui/tab-scroll.svelte.ts:2`: "rests only on tab starts";
   - the report's HELP "Tabs past the strip's width" line ("it rests only with a tab's start at its left edge");
   - the report's DESIGN "Tab strip" bullet ("so no name is cut at that edge").
2. **`src/lib/ui/tab-strip.ts:120`: "a settle never pulls against the gesture" is false,** and the report's DESIGN bullet repeats it. The same function returns a push under 16 px to where it began.
   - Measured: a decaying gesture (129 px), a 321 ms pause, then 10 px more. The strip settled at 207 during the pause, reached 217, and was pulled back to 207.
3. **HELP.md:17 contradicts the report's line-15 replacement.** Line 17 says "At the foot of the rail, beside the appearance controls, one button opens the update tray". The replacement lists Update among the appearance controls. The Doc text does not carry line 17.
4. **Other checks:**
   - no non-ASCII;
   - no history or package ids in added comments (grep of added lines);
   - no missing catalog key;
   - no raw control outside `ui/`;
   - no component over 600 lines or file over 1000;
   - DESIGN.md, HELP.md and README.md are untouched in the diff, as the brief says.

## 4. Behaviour
1. **Widening until the tabs fit leaves the strip overflowing** (not stated; a regression against main).
   - **Cause:** `measure()` (`tab-scroll.svelte.ts:104-106`) sets `tail` from the tab spans, but computes `tabScrollState` from `list.scrollWidth`, which still includes the previous tail. When the tail span re-renders, no ResizeObserver entry or scroll event fires, so nothing measures again.
   - **Measured:**

     | Tabs | Resize | Last tab ends | Width without controls | Controls | Still scrolls |
     |---|---|---|---|---|---|
     | 9 | 1200 to 1400 px | 1251 | 1254 | shown | 57 px |
     | 9 | 1200 to 1440 px | 1251 | 1294 | shown | 17 px |
     | 10 | 1200 to 1600 px | 1448 | 1454 | shown | 54 px |

   - It was still in that state 400 to 600 ms later with no further event; longer not measured.
   - On main, the 1400 and 1440 px cases hide the controls and do not scroll.
2. **How wide the empty space at the end gets** (the report says only "almost as wide as the visible part"):

   | Window | Tail | Share of visible strip |
   |---|---|---|
   | 480 px, last tab Map after wide tabs | 184.5 of 274 px | 67% |
   | 480 px, 6 tabs | 174 of 274 px | 64% |
   | 600 px, 5 tabs | 203.6 of 394 px | 52% |
   | 900 px | up to 192.7 of 694 px | 28% |
   | 1280 px, 9 tabs | 29 px | 3% |

   - It never appeared on a strip whose tabs fit when the strip was measured fresh: in a sweep of 144 widths from 700 to 1400 px, with a press on a tab at each step, no row had the tail or controls while the tabs fit.
3. **A line-mode wheel moves nothing** (not stated; code path shown in Chrome with synthetic events).
   - **Cause:** `horizontalWheelDelta` (`tab-strip.ts:62-64`) ignores `deltaMode`, and `wheel` adds the value as pixels (`tab-scroll.svelte.ts:169-173`).
   - **Measured:** four `deltaMode: 1, deltaY: 3` notches 60 ms apart moved 3, 6, 9, 12, then the settle returned the strip to 0. On main the strip stays at 12.
   - A browser that reports line deltas (Firefox's mouse wheel) needs 6 notches within 300 ms of each other to move a tab. Firefox itself was not run.
4. **A pause over 300 ms turns one gesture into two** (the backward step is not stated).
   - With a 323 ms gap, 129 + 23 px ends at 403, two tabs on; main stops at 152.
   - With a 321 ms gap, 129 + 10 px steps back from 217 to 207.
   - Gaps of 202 and 283 ms end at 207, and main stops at 152 and 139.
5. **Checks with no finding:**
   - **Keyboard:** from Status at 0, eight ArrowRight presses kept the focused tab whole and the left edge on a start at every step (0, 0, 207, 403, 403, 623, 623, 815). Home went to 0 and End to 815.
   - **One tab, or three that fit at 720 px:** no controls, no tail, `scrollWidth == clientWidth`. A wheel over the strip was not prevented and moved nothing.
   - **Control ends:** the left control is disabled at 0 and the right at max.

## Not checked
- Real trackpad or mouse hardware: every gesture used synthetic events or `page.mouse.wheel`.
- Firefox or Safari.
- The real hub on port 8787.
- Wallpaper and text scales other than 1.
- How long the stale overflow of Behaviour 1 lasts beyond 600 ms, and which later event clears it.
- The page strip's widening case.

Reviewer usage: about 45 tool uses, about 19 minutes (17:05 to 17:24).
