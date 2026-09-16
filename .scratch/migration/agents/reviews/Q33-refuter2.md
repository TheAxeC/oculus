# Step Q33 refuter report, second review (on .agents/worktrees/q33, base 133e7c39)

Nothing was written in the worktree or the main checkout. `git status --short` at the end lists the same 30 modified and 3 untracked paths as at the start. The probes ran in APFS clones under `scratchpad/q33-review2/{a,b,c}` (no symlinks). Those clones have been deleted; their output logs are still in that folder. The stray `d16/.../node_modules/node_modules` symlink from the first review no longer exists (`ls`: No such file).

## First review's findings
- **Spec, item 6: tab fragments at the strip's edges.** Closed except at the strip's end: see Spec 1.
- **Spec, the 16-character cut.** Closed. `grep -rn "LABEL_FLOOR\|labelHead\|tab_cut\|tab_hint\|cutTabs" src tests config HELP.md DESIGN.md README.md` prints nothing.
- **Spec, item 8: toggles restyled on a wrong premise.** Closed by the ruling. `ToolButton.svelte:219-228` fills with `--accent-bg` and draws the glyph and name in `--accent-bg-txt`.
- **Spec, item 3: not reproduced.** Closed. It is booked as a limitation and the test is named an audit (`shell-defects.spec.ts:176-186`).
- **Proof, `:171-172` can never fail.** Closed. It is now labelled an audit, and the fade assertions carry the proof.
- **Proof, `flex: 0 0 auto` unproven.** Closed; the rule was removed.
- **Proof, the label colour has no test.** Closed. `shell-defects.spec.ts:552` asserts the name's colour equals `--accent-bg-txt`. The light values differ (`#95492c` against `--accent-txt` `#ad5533`). I did not rerun this revert.
- **Proof, the one-page and width-floor guards.** Closed. The first is stated as a guard; the second was removed.
- **Standards, stale Tooltip head comment and `focusable` doc.** Closed (`Tooltip.svelte:2-15`, `:39-42`).
- **Standards, the "shrunken tabs" comment in Tabs.svelte.** Closed; removed.
- **Standards, ActivityRail comments re-wrapped.** Closed. The remaining comment hunks change the text (`ringKeys` doc, `.ring` comment).
- **Standards, report narration.** Closed.
- **Standards, HELP line-7 text false for the rail list and tab strip.** Closed; the text now carries the "except" clause.
- **Standards, the DESIGN line did not mention Escape.** Closed.
- **Behaviour, pressed toggles, Escape in a nested list, foot arrow order, tab tooltip text, hover after a click.** Closed: stated or ruled. `PaneView.svelte`'s diff no longer touches tab hints.
- **Behaviour, scrollbar tokens on first paint.** Closed (`tokens.css:22-25`). It leaves a false comment behind: Standards 1.

## Verification (rerun by the reviewer)
- **Node tests:** `npx vitest run --reporter=dot` gave `Test Files 229 passed (229)`, `Tests 3830 passed (3830)`. No timing flake.
- **`npm run check`:** `COMPLETED 1156 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- **`npm run build`:** exit 0.
- **`npm run format:check`:** `All matched files use Prettier code style!`
- **`npm run lint`:** exit 0.
- **ASCII gate (perl form):** printed nothing.
- **File lengths:** the tail is `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`. Tabs.svelte 578, ActivityRail.svelte 518, Menu.svelte 451, shell-defects.spec.ts 555.
- **Browser suite:** `npx playwright test` gave `145 passed (3.1m)`.
- **Report figures reproduced** (a vitest probe comparing `deriveTokens` against main's `derive.ts`, rebuilt by reverse-applying `git diff 133e7c39`):
  - `--accent-txt` is the same as main's in 17 of 17 themes, and no existing derived key differs from main.
  - `--accent-bg-txt` on `--accent-bg` ranges from 4.51 (gruvboxlight) to 6.60 (rosepine); light `#95492c` on `#e6d6d2` is 4.56, mocha 6.00.
  - The `:root` defaults equal light's derived values.
  - Foot heights 233.34 px (default) and 270.80 px (mocha).
  - Wheel settle: stopping 3 px before the midpoint between two tab starts returns to the earlier start, and 3 px past it goes on to the next. Checked at 4 gaps.

## 1. Spec
1. **At the strip's end the left edge does not rest on a tab's start, and the report does not say so.**
   - Probe: 10 tabs at 720 px, the same tabs as the spec.
   - Opening the tenth tab reveals it at `scrollLeft 934 = max`. Tab 6 (start 917, width 117) then crosses the left edge with 17 px showing.
   - Pressing the right control from 917 moves 16 px to 933 and leaves the same sliver.
   - A newly opened tab lands at the end, so this is the most common resting state. It is the fragment the ruling set out to remove.
   - `tab-strip.ts:72-74` admits it ("or the end of the strip"). The round-2 report and its HELP and DESIGN Doc text say the strip "rests with a tab's start at its left edge" with no exception.
   - This is a ruling not met at one position. The fix is a decision for the orchestrator (for example, trailing space so that max lands on a start).
2. The round-2 `press` reveal is disclosed as a decision. No other silent decision found.

## 2. Proof
1. **Confirmed: the reveal assertions do not isolate the reveal.**
   - Copy b reverted every `reveal()` use to main's `scrollIntoView` nearest (the `$effect`, `keys`, `press` and `resized`) and kept the settle. The tab test went red only at `shell-defects.spec.ts:443` (active tab whole after pressing a tab the far edge crosses). `:420-421` stayed green.
   - What would prove the `$effect` reveal: at 720 px, scroll the strip to 0 and activate Archive (index 4, span 623 to 813) from the rail. On the tree the strip rests at 403 with Archive whole; on copy b it rests at 207 with Archive cut by the right edge.
   - What would prove `resized()`: with Map active at 623, narrow the window from 900 to 640 px. The tree reveals Map (815, whole); copy b leaves it crossed (623, not whole). No test resizes.
2. **The scroll-control step is unproven in the browser.**
   - Copy c reverted only `scrollOne` (`Tabs.svelte:250`) to main's first-tab-width `scrollBy` and kept the settle.
   - `shell-defects.spec.ts` "tabs" and `tabs.spec.ts:37` both stayed green (`2 passed`), because the settle snaps to a start either way.
   - The report's r2a revert removed the settle at the same time, so it does not show this. Only the node cases of `tabEdgeStep` cover it.
3. **The edge predicate counts the strip's end as an edge.** `shell-defects.spec.ts:383-385` and `tabs.spec.ts:107` accept `at >= max - 1`, so the left-edge sliver in Spec 1 passes both tests.
4. **Other checks:**
   - no test asserts a defect;
   - no node threshold was widened (the `tab-strip.test.ts:71` bound is the largest gap, 102/2 + 1);
   - no module-level mutable state (`settleTimer` at `Tabs.svelte:103` is per instance; `fade` and `opened` are component state).

## 3. Standards
1. **`src/routes/+layout.svelte:30`:** "Before the tokens are set the bar is the browser's own." This is false: `tokens.css:24-25` give `:root` defaults, imported at `+layout.svelte:4`.
2. **`src/lib/ui/Tabs.svelte:19-22`:**
   - "so the first tab it shows is always whole" is false at the strip's end (Spec 1).
   - "The far edge may cross a tab, which is the one place a name shows in part" is false for the same reason.
3. **`tests/ui/colours.test.ts:6`:** "the six `--on-<surface>` on `--<surface>` pairs". `SURFACES` (`:51`) now holds seven, and `:484` counts `names.length * SURFACES.length`.
4. **`tests/browser/tabs.spec.ts:37`:** the title still says "move by one tab", while its head comment (`:2`) says the strip moves to the next tab's edge.
5. **Report Doc text, HELP "Tabs past the strip's width" and the DESIGN decision line:**
   - "rests with a tab's start at its left edge" and "the far edge may show part of a tab" are false at the strip's end.
   - The DESIGN line justifies the far-edge crossing with "as VS Code's strip does". The hub rule is that prior art is not a justification.
6. **Round-2 report Limitations** leave out Spec 1 and Behaviour 1, 2 and 4.
7. **Other checks:** no non-ASCII; no raw control outside the primitives; no missing catalog key; no package id or date in added comments (grep of added lines).

## 4. Behaviour
1. **The settle fights a trackpad gesture that pauses for more than 120 ms** (`SETTLE`, `Tabs.svelte:106`). Measured with synthetic `WheelEvent`s (deltaX 3) dispatched on the strip:
   - Continuous, every 16 ms, 60 events: no backward step; stopped at 180, settled at 207.
   - 15 events (at 48), a 250 ms pause, then 15 more: the settle ran during the pause and returned the strip to 0. The gesture resumed from 3 and ended at 45, which settled to 0. A 90 px gesture moved nothing.
   - 180 ms pause: the position ran 48, 13, 10, 13 as the settle's smooth scroll pulled back against the continuing events. Final 0.
   - 130 ms pause: 51 then 50, final 105.
   - The report says only that a settle can move the strip back by up to half a tab.
2. **A single wheel notch can do nothing.** A deltaY of 100 from Coauthor's start (403, width 217) scrolled to 503 and settled back to 403. From narrower tabs one notch moves a whole tab: 207 to 403 is 196 px; 623 to 815 is 192 px.
3. **The right control's last press moves 16 px** (917 to 933) and shows a 17 px sliver at the left edge (Spec 1).
4. **Resize reveals the active tab only when an edge crosses it.**
   - Narrowing 720 to 560 px with Map active at 623 left Map wholly out of view, and it was not brought back. Main behaves the same way here.
   - Narrowing 900 to 640 px, where the right edge crossed Map, brought it in whole (815).
   - `Tabs.svelte:157` describes this case as a tab "the reader has scrolled" out of sight, but here a resize put it there. Not stated in the report.
5. **Scrollbar thumb against track contrast** runs from 1.70 (solarized) and 1.83 (rosepine, kanagawa) to 3.13 (dark); light is 2.25. Not stated.
6. **Pressed toggle under mocha:** the border goes from 0 to 1 px with no size change (89x34 before and after, `box-sizing: border-box`), and the foot height is unchanged. No finding.

## Not checked
- Real trackpad or mouse hardware: the gesture figures come from synthetic wheel events.
- The real hub on port 8787.
- Wallpaper and text scales other than 1.
- Contrast of the menu's Back entry.
- The node-only reverts the report names but did not run (`tab-strip.test.ts`, `activity-rail.test.ts`, the first-paint test).
- The pressed-toggle label revert (not rerun).

Reviewer usage: about 40 tool uses, about 15 minutes (16:30 to 16:45).
