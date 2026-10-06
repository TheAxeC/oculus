# Step Q41 refuter report (on .agents/worktrees/q41, base 129806c3)

## Verification (rerun by the reviewer)
All from `tools/oculus` in the worktree:
- `npx vitest run --reporter=dot`: Test Files 240 passed (240), Tests 4052 passed (4052). No timing test failed, so nothing was rerun alone.
- `npm run check`: COMPLETED 1193 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS.
- `npm run lint`: exit 0, no output.
- `npm run format:check`: "All matched files use Prettier code style!"
- The ASCII gate (perl): 0 lines.
- `yaml.safe_load` on `config/vocab.yml`: ok.
- `npm run build`: exit 0.
- `npx playwright test` on focus-look, focus-buttons and focus-drag: 8 passed (21.1s). The lock was free.
- `git status --short` matches the diff: 7 files modified, plus `tests/lane-distance.test.ts` and `tests/themes.ts` new. Nothing else is in the tree.

## 1. Spec
- **Brief items against the rulings.** The rulings are met: `LANE_SHARE` is 0.5 (`src/lib/themes/derive.ts:51`), the 22 pairs are held under all 17 themes, and colours repeat only between headers the test does not count as touching. The waiting item is built. Review, De-risk and Jobs are each on a hue no other header uses.
- **tests/lane-distance.test.ts:152-181 against the layout, wide and narrow.** The 12 next, 6 stacked and 4 Ideas pairs match what `Lanes.svelte` and `Band.svelte` draw at 1600 wide, where headers sit at x 124, 617 and 1109. At 820 wide, the `@media (max-width: 900px)` rule gives one column (all x = 124), and there only the next pairs apply. The test models that correctly.
- **A band column hidden.** `Band.svelte:91` draws a column only when it has rows. The served demo hides Jobs, so Funding sits beside Teaching, a pair the test does not hold. I measured it at 10 or more in every theme (`scratchpad/q41-review/pairs.py` over the derived tokens), so no defect today. The only other pair a hidden column creates, Ideas beside Jobs, is already held.
- **Finding: a collapsed cluster puts identical headers on top of each other.**
  - Each cluster is its own `<details class="cluster" open>` (`Lanes.svelte:348`, `:366`; `Band.svelte:104`), and a reader can collapse it.
  - The test counts headers stacked across a cluster's summary line as touching (for example revise/backburner), but it never models a collapsed cluster.
  - Collapsing Ideas puts Build above Teaching, both teal: CIEDE2000 0.00 in all 17 themes. That needs a Jobs column in the band, or a one-column board with only Teaching shown.
  - Collapsing Incubation puts the Ideas lane under the parked row: blocked/holding is 6.05 in mocha and 9.57 in everforest.
  - With Ideas collapsed and only Teaching shown, scope/teaching is 0.00 in synthwave, dracula, solarized and gruvboxlight.
  - With Incubation and Ideas both collapsed, jobs/review and backburner/jobs are 0.00 in 10 themes.
  - The vocab.yml comment (`config/vocab.yml:156`) says every header differs from every header it touches, which is false in these layouts. The test head comment (`tests/lane-distance.test.ts:9-17`) describes the layout without the collapse.
- **Colour choices** (report, "Review, De-risk and Jobs").
  - Review is slate: "work sitting out of your hands", unused elsewhere. The reason holds.
  - De-risk is honey: the caution colour, unused. The reason holds.
  - Jobs is grey-d with no meaning given, only "the only fit left unused once Review takes slate". The board now carries three grey headers (Review slate, Backburner grey, Jobs grey-d). This is within the ruling ("an unused hue where one fits"); it is noted, not a defect.
- **The strip's tallies** (`src/lib/state/focus.ts:260-274`). They count the live projects plus every project `laneItems` draws, and blocked stays over every tier. It matches decision 1.
  - Finding, `focus.ts:246-247`: the doc comment says "one per project the board shows: every live project". An active or manuscripts project with no `focus:` is counted but not drawn as a card (only the unplaced hint names it). A non-idea live project whose `focus:` names no lane is counted too. So "the board shows" is not true of every live project.

## 2. Proof
- **Reverts rerun in my own copy** (`scratchpad/q41-review/oculus`, a clone):
  - The base colours (Review #7c5cff, Backburner #64748b, De-risk #6366f1, Jobs violet) at 0.5: 10 failed, e.g. "gruvbox: beside the full-width Ideas lane holding (mauve) / jobs (violet) = 0.00" and "everforest: stacked in one column blocked (red) / derisk (indigo) = 9.57".
  - The new colours at `LANE_SHARE` 0.2: 16 failed, e.g. "nord: stacked in one column backburner (grey) / build (teal) = 4.52".
  - Review on Run's hue: 18 failed, "stacked in one column run (green) / review (green) = 0.00".
  - The Ideas row drawn as `full: false`: the pairing case and the theme cases fail.
  - `waiting()` put back to `if (!live(project)) continue;`: both new tally cases fail, 2 failed.
  - The tier and lane condition dropped: "leaves a project of another tier that is on no lane..." fails.
  - `-lane-txt` measured on the four page surfaces again: 7 themes fail, e.g. "mocha: --c-gold-lane-txt on --bg = 1.00:1".
  - `color: var(--c-green-lane-txt)` added to `.lane-sub` in `Lanes.svelte`: "lib/views/focus/Lanes.svelte:440 paints green lane text off its lane".
- **CIEDE2000.**
  - I ran `ciede2000` from `tests/lane-distance.test.ts:57` over all 34 pairs of Sharma, Wu and Dalal (2005) Table 1, both orders, at a tolerance of 5e-5: 0 mismatches.
  - A control row with a wrong expected value went red.
  - My own independent Python version also matches all 34.
  - The `lab()` of #ff0000 is (53.24, 80.09, 67.2), and dropping `rt` gives row 1 as 1.608, both as the test says.
  - Finding, `tests/lane-distance.test.ts:198`: the comment names "rows 1, 7, 13, 17 to 21 and 25". The third pair in the test, (50, 2.49, -0.001) and (50, -2.49, 0.0009) = 7.1792, is row 9. Row 13 is (50, -0.001, 2.49) and (50, 0.0009, -2.49) = 4.8045.
- **Narrowing `-lane-txt` to its own lane** (`tests/contrast.test.ts:45`).
  - The narrowing itself follows the stated rule. `LaneHead.svelte:25,41-42` is the only component that paints lane text, and it paints it on `--lane`. Measuring it on page surfaces was a pair no component draws.
  - It removes a real safety net, though. At 0.5, dark-theme lane text is dark ink (1.00 to 1.50:1 on the page surfaces), and the old measurement would have caught any lane text landing off its strip.
  - The narrowing is therefore only as safe as the src/ reading case, and that case misses the natural ways it could happen. I probed each in my copy; the case stayed green ("Tests 1 passed") for all three:
    - `:global(body.wall) .lane-h { background: transparent; }` added to `LaneHead.svelte`. This is the wallpaper hazard the component's own comment names.
    - `.count { background: var(--chip); }` in `LaneHead.svelte`, a child element drawn on its own surface in the inherited lane text.
    - `.lane-name { background: var(--panel); }` in `LaneHead.svelte`.
  - The check only asks whether the one block that reads `var(--lane-txt)` fills with `var(--lane)`. It does not see a later rule that overrides that background, or a descendant with its own background.
  - Finding, `tests/contrast.test.ts:4-6`: the claim that the last case "holds" that the header is the one place lane text is painted is overstated. The report's "What the reading does not cover" lists two gaps but not these three. The DESIGN.md line it proposes ("reads src/ to hold that no other place paints it") carries the same overstatement.
  - Finding, same place: "the last case below" is not the last case. The src/ case is at `:218`, and `:227` and `:248` follow it.
  - No browser case checks the header under `body.wall`. focus-look checks light and mocha only.

## 3. Standards
- **Stale doc text** (brief decision 3 defers these; the report carries the replacement lines):
  - `DESIGN.md:228` says "a fifth of the hue in the panel", now false.
  - `DESIGN.md:330` says the tallies "stay over the three live tiers", now false. The report proposes a new log entry that "supersedes" it but no edit to line 330, so that sentence would stay false after the proposed Doc text is applied.
- **False comment sentences:**
  - `config/vocab.yml:156`: collapsed clusters (section 1).
  - `tests/contrast.test.ts:4-6`: "the last case below" and "holds" (section 2).
  - `tests/lane-distance.test.ts:198`: "13" (section 2).
  - `focus.ts:246-247`: "the board shows" (section 1).
- **Head comment:** `src/lib/themes/derive.ts:44-50`, the `LANE_SHARE` comment, is true for the 22 pairs. It ties a pure colour module to the Focus layout and a test file by name. That is noted, not a defect.
- **History:** no package id or date in any added line (`git diff 129806c3 | grep '^+.*\(Q[0-9]\+\|2026\)'` is empty). The revert comments follow the tree's convention.
- **Non-ASCII:** gate clean.
- **File sizes:** all under 1000 lines. `tests/state/focus.test.ts` 803, `tests/contrast.test.ts` 256, `tests/lane-distance.test.ts` 290, `tests/themes.ts` 34.
- **Paths:** within the brief plus the ruling's widening (`derive.ts`, the `Focus.svelte` comment). `tests/config-folder.test.ts:283` also changed, carrying the Jobs tone. It is not in the brief's path list; it is a needed follow-on.

## 4. Behaviour
Screenshots are in `scratchpad/q41-review/shots/` (`<theme>-1600.png`, `<theme>-820.png`, `strip-*.png`), from my own serve of the build on 8792 through `tests/browser/serve.ts`. In the run's copy of the hub, the coauthor project `spectral-clustering-collab` was given `focus: blocked` and `waiting-on: [chen-graph]`. No demo project carries `waiting-on:`.
- **Strength.**
  - Light: solid pastel strips (Run #8ad1a4, Push #92b1f5).
  - Dark: deep saturated strips in the hue text (Run #145e3a).
  - Dracula, gruvbox, everforest: mid-tone strips with light text. The strips are much heavier than before and dominate each lane.
- **Touching headers.** No two touching headers look alike at either width. The closest pair seen is Backburner/Scope in everforest, 10.28, grey against grey-teal, visibly close. Headers that do not touch repeat:
  - Dracula: Push, Review and Backburner are one slate (#454e6d); Scope, Build and Teaching one teal (#598999); De-risk and Funding one olive.
  - Everforest: Revise, De-risk and Funding are one brown (#84785d); Push and Scope one; Review and Backburner one; Build and Teaching one.
  - Gruvbox: Revise, De-risk and Funding are three near-identical mustards.
  - In the one-column layout at 820, dracula shows the same slate three times and the same teal three times down the page.
- **Header text.** Readable in all five themes. The browser-computed ratios are 4.51 to 4.88.
- **Awaiting strip** (identical in all 10 shots): "Waiting on Wei Chen x1 | Under review Journal of Machine Learning Research x1 | Applications ... | Host outreach ... | Blocked 1". The coauthor card on Blocked says "Waiting on Wei Chen", and the Blocked lane counts 2. At 820 the strip wraps to two lines cleanly.

## Not checked
- `tests/integrity.test.ts` and the real-hub probe beyond the full vitest run.
- Themes other than the five named, in the browser. The other 12 were covered by token derivation only.
- A collapsed cluster and the wallpaper mode in the browser. Both are from derived tokens and source probes only.
- The builder's scratch searches (`q41-builder/choose05.ts`) were not rerun.

Reviewer usage: about 50 tool uses, about 12 minutes (16:38 to 16:50).
