# U4 report: the Focus and Sessions views on the other views' scale, and the commit dropdown aligned

The full report is saved at `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U4/tools/oculus/.scratch/migration/agents/reviews/U4-report.md` (the only untracked file in the worktree). It is reproduced here in full.

Everything in the brief is done, with item 5 as amended by Z180 (b) (the Sessions rows stay two lines at 40 px, the title on `--fs-sm` and the details on `--fs-xs`). Not verified: every pixel figure below is arithmetic from the declarations (no browser was opened, by the rules), so the sizes, the hover states, the reveal and the terminal palette are for the landing's look.

## Open items of the state file (verbatim, `orchestrator-state.md:140-150` of this worktree's copy)

- Z180, one line or two per row in the Sessions list (raised 2026-10-01 21:28 by U4's brief check, Premises 6). Axel's U4 ruling says the Sessions view is far too large; the U2 audit kept the two-line row ("Better and kept: a session row shows title, meta, status dot and 'needs input' in two lines", `agents/reviews/U2-audit.md:461`), and VS Code's own agent session item is two rows. Going to one line reverses that kept item, so it is Axel's. U4 is built meanwhile with option (b).
  - (a) One 22 px row per session and terminal: the title, then the agent, model, age, files and prompts muted after it, cut first when the row is narrow. Pro: half today's height, the same row as every other list. Con: the details are cut in a narrow pane; it reverses the kept two-line row.
  - (b) Two lines at VS Code's own two-row size: an 18 px title line and a 16 px details line, 40 px a row (44 today). Pro: nothing hidden, the kept item stands, VS Code's own form. Con: only 4 px less per row.
  - (c) Two lines as today, 44 px. Con: answers nothing of the ruling; the lazy option.
  - Recommendation: (a), since the ruling asks for the size of the other views and only (a) reaches it. If Axel rules (a) before U4 lands, U4 takes it in a repair round.

The coordinator's message during the build says Axel ruled Z180 (b), with the fonts one step smaller. This worktree's copy of the state file predates that ruling, so it still lists Z180 as open. The build is (b) with the two font steps.

## The cases, first run on the unchanged tree

Cases 4, 7 and 8 were written as tests (`tests/views/boards/focus.test.ts`, `tests/views/sessions/session-list.test.ts`) and run before any source change. Command: `npx vitest run tests/views/boards/focus.test.ts tests/views/sessions/session-list.test.ts tests/ui/primitives.test.ts tests/views/whole/type-scale.test.ts tests/ui/theme/wall.test.ts tests/views/sources/repositories/commit-box.test.ts tests/views/sessions/sessions.test.ts --reporter=dot`, result `Test Files 2 failed | 5 passed (7)`, `Tests 2 failed | 488 passed (490)`, the two failures being cases 4 and 7. Case 11 command: `npx vitest run tests/views/boards tests/views/sessions tests/ui tests/checks --reporter=dot`.

| Case | Kind | First run result |
|---|---|---|
| 1 | reading of `MenuOpener.svelte` | `.opener.compact` (:125-137) sets `height: var(--header-action)` (:130) and `font-size: var(--fs-lg)` (:135), and `.opener.compact:hover` (:139-142) sets the chip fill and ink; `.opener.primary` (:162-174) sets no height. All three match a compact primary opener: fails, as the brief says. |
| 2 | reading of `Ticker.svelte` | `.act` (:428-442) has `font-weight: 700` (:437), `text-transform: uppercase` (:438), `letter-spacing: 0.04em` (:439) and `background: var(--chip)` (:433): fails, as the brief says. `tests/ui/primitives.test.ts` is one of the 5 files that passed unedited. |
| 3 | look | not run; seen at the landing. |
| 4 | server render | `tests/views/boards/focus.test.ts > a card > draws the move menu opener as the small text button` fails: the opener renders `class="opener svelte-ap2r4q"`, no `small`. |
| 5 | server render and audit | `focus.test.ts` passes (the lane head renders `lane-name`). The audit row `tests/views/whole/type-scale.test.ts:127` reads `.lane-title=fs-md`, the value item 7 changes. |
| 6 | server render | `session-list.test.ts` "draws each row as two lines" (:87-95) passes unedited. |
| 7 | server render | `session-list.test.ts > draws no empty slot and no doubled separator for a session with no age` fails: received `Claude / opus-5 / (empty) / 0 files / 0 prompts` with the meta separator `|` between the parts. |
| 8 | server render | `session-list.test.ts > draws no model and no extra separator for a session with no model` (a row with an age and no model) passes. |
| 9 | look | not run; seen at the landing. |
| 10 | look | not run; seen at the landing. |
| 11 | scoped run | The second run of the four folders printed `Test Files 2 failed | 90 passed (92)`, `Tests 2 failed | 1294 passed (1296)`; the two failures are the new cases 4 and 7. The first run of the same command printed `3 failed | 89 passed`; I kept only its last 40 lines, which named the same two, and the third failing test was not captured and did not fail in the rerun. Which test it was is not verified. |

No case turned out wrong under the brief's rules and no path outside the list was needed, so the build went on.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Commit dropdown aligned | DONE | `MenuOpener.svelte:140` and `:154` are `.opener.compact:where(:not(.primary))` and its `:hover`; `grep -n "height: var(--header-action)" src/lib/ui/menu/MenuOpener.svelte` prints `145:        height: var(--header-action);`, inside the rule at :140 that excludes `.primary`. `CommitBox.svelte` is unchanged: `.acts` is a stretching grid and `Tooltip`'s `.tip` a flex box (`Tooltip.svelte:300-303`), so the opener takes the button's height. |
| 2 Ticker row actions as the small button | DONE | the brief's grep 2 (quoted below) prints nothing (exit 1). `.act` keeps its element, classes, `title`, script and reveal rules; `tests/ui/primitives.test.ts` passes unedited. |
| 3 Focus on the counterparts' spacing | DONE | Declarations in the table below; `QuickAdd.svelte` has no value above 8px and no bordered panel, so it has no change. |
| 4 Small menu opener | DONE | `Menu.svelte` and `MenuOpener.svelte` gain `small`; `LaneCard.svelte:117` passes it; the case-4 test passes. |
| 5 Sessions list at 40 px, amended fonts | DONE | `SessionWorkspace.svelte:282-308` and `TerminalRows.svelte:205-230`; no age draws no slot and no doubled separator (case-7 test passes); `SessionList.svelte` `.rows` has no gap. |
| 6 Files and Repositories | DONE, no change beyond item 1 | no file of those views is changed. |
| 7 Tests and docs | DONE | tests listed below; `DESIGN.md:369`, `:404`, `:408` changed; `HELP.md:100` states no size, so it is unchanged. |
| Verify list | DONE | one full-list run, output below. |
| `docs/diagrams/` regenerated | DONE, nothing to commit | `npm run diagrams` ran inside the list; `git status --short` lists no path under docs (`grep -c docs` prints `0`). |

### The full verify list (run 1 of 1), the lines checks.sh printed

```
$ npm test
 Test Files  418 passed | 22 skipped (440)
      Tests  10977 passed | 618 skipped (11595)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790883891563 COMPLETED 2947 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
  done
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The command was `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && ... sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0. The "done" line is the build's closing line (the tool prints a check mark before it, left out here).

### The brief's verify greps 2 to 4

```
--- 2: grep -n "text-transform: uppercase\|letter-spacing" src/lib/ui/display/Ticker.svelte
(prints nothing)
--- 3: grep -rnE "(padding|margin|gap|column-gap|row-gap)[^;]*\b(9|1[0-9]|2[0-9])px|border-radius: (6|8|10|12)px" src/lib/views/boards/focus src/lib/views/sessions/session-list
src/lib/views/boards/focus/CommandCenterView.svelte:222:        column-gap: 16px;
src/lib/views/boards/focus/Tasks.svelte:113:        column-gap: 16px;
src/lib/views/boards/focus/CareerPanel.svelte:367:        padding-left: 16px;
src/lib/views/boards/focus/CareerPanel.svelte:465:        padding: 2px 8px 4px 24px;
src/lib/views/boards/focus/CareerPanel.svelte:478:        padding-left: 16px;
src/lib/views/sessions/session-list/TerminalRows.svelte:225:        padding-left: 12px;
src/lib/views/sessions/session-list/SessionWorkspace.svelte:303:        padding-left: 12px;
--- 4: grep -n "height: var(--header-action)" src/lib/ui/menu/MenuOpener.svelte
145:        height: var(--header-action);
```

Reasons for the grep 3 lines: the two `column-gap: 16px` are the brief's value for the week and tasks blocks. `CareerPanel.svelte:367` and `:478` are the ordered list's and the criteria list's indent (was 20px), set to 16px, the nearest of the brief's values on the smaller side, which leaves room for the list markers. `CareerPanel.svelte:465` is the brief's `2px 8px 4px 24px` for the host body. The two `padding-left: 12px` of the Sessions rows are the dot (8px) plus its gap (4px), which put the details line under the title; they are not a panel spacing.

## Changed declarations (line numbers are after the change; no other declaration changed)

| File | Line | Selector | Property | Before | After |
|---|---|---|---|---|---|
| `ui/display/Ticker.svelte` | 437 | `.act` | background | `var(--chip)` | `var(--panel)` |
| `ui/display/Ticker.svelte` | 440 | `.act` | font-weight | 700 | 400 |
| `ui/display/Ticker.svelte` | (removed) | `.act` | text-transform, letter-spacing | `uppercase`, `0.04em` | none |
| `ui/menu/MenuOpener.svelte` | 130-134 | `.opener.small` (new) | font-size, line-height, padding | none | `var(--fs-xs)`, `calc(14px * var(--text-scale, 1))`, `3px 6px` |
| `ui/menu/MenuOpener.svelte` | 140 | selector | `.opener.compact` | `.opener.compact` | `.opener.compact:where(:not(.primary))` |
| `ui/menu/MenuOpener.svelte` | 154 | selector | `.opener.compact:hover` | `.opener.compact:hover` | `.opener.compact:where(:not(.primary)):hover` |
| `views/boards/focus/lanes/LaneCard.svelte` | 117 | `<Menu>` | prop | none | `small` |
| `views/boards/focus/lanes/LaneCard.svelte` | 228 | `.wait, .next` | line-height | `calc(var(--tree-row) * var(--text-scale, 1))` | `calc(18px * var(--text-scale, 1))` |
| `views/boards/focus/lanes/LaneHead.svelte` | 48 | `.lane-h` | align-items | baseline | center |
| `views/boards/focus/lanes/LaneHead.svelte` | 51-52 | `.lane-h` | height, padding | none, `3px 6px` | `calc(var(--tree-row) * var(--text-scale, 1))`, `0 6px` |
| `views/boards/focus/lanes/LaneHead.svelte` | 64-67 | `.lane-title` | min-width, font-size, text-transform | none, `var(--fs-md)`, none | `0`, `var(--fs-xs)`, `uppercase` |
| `views/boards/focus/lanes/LaneHead.svelte` | 70-75 | `.lane-name` (new) | min-width, overflow, text-overflow, white-space | none | `0`, `hidden`, `ellipsis`, `nowrap` |
| `views/boards/focus/lanes/LaneHead.svelte` | 78 | `.count` | flex | none | `none` |
| `views/boards/focus/lanes/Lanes.svelte` | 330-331 | `.lanes` | gap, margin-top | `10px`, `8px` | `8px`, `4px` |
| `views/boards/focus/lanes/Lanes.svelte` | 342, 345 | `.lane` | padding, border-radius | `8px`, `8px` | `4px 8px`, `var(--input-radius)` |
| `views/boards/focus/lanes/Lanes.svelte` | 366 | `.lane-sub` | margin | `4px 0 6px` | `2px 0 4px` |
| `views/boards/focus/lanes/Lanes.svelte` | 374, 376 | `.lane-body` | gap, min-height | `6px`, `26px` | `4px`, `calc(var(--tree-row) * var(--text-scale, 1))` |
| `views/boards/focus/Band.svelte` | 186-187 | `.lanes` | gap, margin-top | `10px`, `8px` | `8px`, `4px` |
| `views/boards/focus/Band.svelte` | 194, 197 | `.lane` | padding, border-radius | `8px`, `8px` | `4px 8px`, `var(--input-radius)` |
| `views/boards/focus/Band.svelte` | 207 | `.lane-sub` | margin | `4px 0 6px` | `2px 0 4px` |
| `views/boards/focus/Band.svelte` | 215, 217 | `.lane-body` | gap, min-height | `6px`, none | `4px`, `calc(var(--tree-row) * var(--text-scale, 1))` |
| `views/boards/focus/Band.svelte` | 221 | `.stage` | margin | `0 0 4px` | `0 0 2px` |
| `views/boards/focus/Band.svelte` | 232 | `.stage-block` | gap | `4px` | `2px` |
| `views/boards/focus/Band.svelte` | 283 | `.note` | line-height | `calc(var(--tree-row) * var(--text-scale, 1))` | `calc(18px * var(--text-scale, 1))` |
| `views/boards/focus/Focus.svelte` | 191 | `.focus` | gap | `14px` | `8px` |
| `views/boards/focus/Focus.svelte` | 205, 206, 208 | `.waitroll` | gap, padding, border-radius | `8px`, `8px 12px`, `8px` | `4px`, `4px 8px`, `var(--input-radius)` |
| `views/boards/focus/CommandCenterView.svelte` | 216, 219, 222 | `.week` | padding, border-radius, column-gap | `10px 12px`, `8px`, `26px` | `4px 8px`, `var(--input-radius)`, `16px` |
| `views/boards/focus/CommandCenterView.svelte` | 233 | `.head` | gap | `12px` | `8px` |
| `views/boards/focus/CommandCenterView.svelte` | 249 | `.grp` | margin-top | `9px` | `4px` |
| `views/boards/focus/Tasks.svelte` | 107, 110, 113 | `.tasks` | padding, border-radius, column-gap | `10px 12px`, `8px`, `26px` | `4px 8px`, `var(--input-radius)`, `16px` |
| `views/boards/focus/Tasks.svelte` | 124 | `.head` | gap | `12px` | `8px` |
| `views/boards/focus/Tasks.svelte` | 137 | `.grp` | margin-top | `9px` | `4px` |
| `views/boards/focus/CareerPanel.svelte` | 258 | `.career` | border-radius | `8px` | `var(--input-radius)` |
| `views/boards/focus/CareerPanel.svelte` | 271 | `.career > summary` | padding | `8px 12px` | `4px 8px` |
| `views/boards/focus/CareerPanel.svelte` | 288 | `.body` | padding | `8px 14px 12px` | `4px 8px` |
| `views/boards/focus/CareerPanel.svelte` | 292 | `.seclbl` | margin | `10px 0 3px` | `4px 0 2px` |
| `views/boards/focus/CareerPanel.svelte` | 322 | `.fact` | border-radius | `6px` | `var(--input-radius)` |
| `views/boards/focus/CareerPanel.svelte` | 345, 348 | `.milestone, .caveat` | padding, border-radius | `5px 10px`, `6px` | `4px 8px`, `var(--input-radius)` |
| `views/boards/focus/CareerPanel.svelte` | 367 | `.order` | padding-left | `20px` | `16px` |
| `views/boards/focus/CareerPanel.svelte` | 393 | `.when` | border-radius | `6px` | `var(--input-radius)` |
| `views/boards/focus/CareerPanel.svelte` | 416 | `.host` | border-radius | `6px` | `var(--input-radius)` |
| `views/boards/focus/CareerPanel.svelte` | 465 | `.hostbody` | padding | `2px 10px 7px 26px` | `2px 8px 4px 24px` |
| `views/boards/focus/CareerPanel.svelte` | 478 | `.crit` | padding-left | `20px` | `16px` |
| `views/sessions/session-list/SessionWorkspace.svelte` | 276-279 | `.line` | height, display, align-items, gap | held by `.line` | `min-width: 0; white-space: nowrap` only; the flex box and height move to `.one`, the block to `.two` |
| `views/sessions/session-list/SessionWorkspace.svelte` | 282-288 | `.one` | display, align-items, gap, height, margin-top | none (was in `.line`: flex, center, 4px, `calc(var(--tree-row) * var(--text-scale, 1))`) | flex, center, `4px`, `calc(18px * var(--text-scale, 1))`, `3px` |
| `views/sessions/session-list/SessionWorkspace.svelte` | 293 | `.one .nm` | font-size | `var(--fs-md)` | `var(--fs-sm)` |
| `views/sessions/session-list/SessionWorkspace.svelte` | 299-308 | `.two` | display, height, margin-bottom, overflow, text-overflow, line-height, font-size | flex (from `.line`), `calc(var(--tree-row) * var(--text-scale, 1))`, none, `hidden`, none, none, `var(--fs-sm)` | `block`, `calc(16px * var(--text-scale, 1))`, `3px`, `hidden`, `ellipsis`, `calc(16px * var(--text-scale, 1))`, `var(--fs-xs)` |
| `views/sessions/session-list/TerminalRows.svelte` | 197-203, 205-210 | `.top` | display, align-items, gap, height, margin-top | held by `.top, .meta` | flex, center, `4px`, `calc(18px * var(--text-scale, 1))`, `3px` |
| `views/sessions/session-list/TerminalRows.svelte` | 216 | `.top .nm` | font-size | `var(--fs-md)` | `var(--fs-sm)` |
| `views/sessions/session-list/TerminalRows.svelte` | 221-230 | `.meta` | display, height, margin-bottom, overflow, text-overflow, line-height, font-size | flex, `calc(var(--tree-row) * var(--text-scale, 1))`, none, `hidden`, none, none, `var(--fs-sm)` | `block`, `calc(16px * var(--text-scale, 1))`, `3px`, `hidden`, `ellipsis`, `calc(16px * var(--text-scale, 1))`, `var(--fs-xs)` |
| `views/sessions/session-list/TerminalRows.svelte` | (removed) | `.meta .act` | overflow, text-overflow | `hidden`, `ellipsis` | rule removed; the whole `.meta` line is cut instead |
| `views/sessions/session-list/SessionList.svelte` | (removed) | `.rows` | gap | `4px` | none |

Markup change: `SessionWorkspace.svelte:104` reads `{@const age = since(entry)}` and `:154-157` draw the age and its separator only when `age !== ''`.

## Files changed (`git diff --stat`)

`DESIGN.md` (3 lines), `ui/display/Ticker.svelte`, `ui/menu/Menu.svelte` (+7), `ui/menu/MenuOpener.svelte`, the Focus partials `Band`, `CareerPanel`, `CommandCenterView`, `Focus`, `Tasks`, `lanes/LaneCard`, `lanes/LaneHead`, `lanes/Lanes`, the Sessions list `SessionList`, `SessionWorkspace` (338 lines), `TerminalRows` (236 lines), and the four test files below. `git diff --stat` over the tracked files: 19 files changed, 221 insertions, 96 deletions; this report is the only untracked file.

## Changed tests

| Test | Before | After |
|---|---|---|
| `tests/views/whole/type-scale.test.ts` (audit of source text) `LaneHead.svelte` | `.lane-title=fs-md`, `.count=fs-xs` | `.lane-title=fs-xs`, `.count=fs-xs` |
| same, `SessionWorkspace.svelte` | `.one .nm=fs-md`, `.two=fs-sm` | `.one .nm=fs-sm`, `.two=fs-xs` |
| same, `TerminalRows.svelte` | `.top .nm=fs-md`, `.meta=fs-sm` | `.top .nm=fs-sm`, `.meta=fs-xs` |
| same, `MenuOpener.svelte` | `.opener=fs-sm`, `.opener.compact=fs-lg`, then the rice rule | `.opener=fs-sm`, `.opener.small=fs-xs`, `.opener.compact:where(:not(.primary))=fs-lg`, then the rice rule |
| `tests/ui/theme/wall.test.ts:119` (audit of source text) | key `MenuOpener.svelte .opener.compact:hover` | key `MenuOpener.svelte .opener.compact:where(:not(.primary)):hover` |
| `tests/views/boards/focus.test.ts` new case | none | "draws the move menu opener as the small text button" (server render, case 4) |
| `tests/views/sessions/session-list.test.ts` new cases | none | "draws no empty slot and no doubled separator for a session with no age" (case 7) and "draws no model and no extra separator for a session with no model" (case 8), both server renders over the details line's words |

Unedited and passing: `tests/ui/primitives.test.ts` (Ticker cases), `tests/views/sessions/session-list.test.ts` "draws each row as two lines" (:87-95), `tests/views/boards/focus.test.ts` (existing cases).

The type-scale and wall rows are audits of source text: they prove which selector carries which size and which hover rule is listed as solid, not how anything looks. Case 1 (no rule matching a compact primary opener sets the height, the `--fs-lg` size or the chip hover) has no render test, since a server render shows no computed style; it is the reading at `MenuOpener.svelte:140-154` and the type-scale audit key, which goes red if the selector goes back to `.opener.compact`.

## Judgment calls the brief did not cover (each reversible)

1. The compact rules are written `.opener.compact:where(:not(.primary))`, not `.opener.compact:not(.primary)`. The plain `:not(.primary)` form raises the rules' specificity from (0,2,0) to (0,3,0), and `.opener.bare` (a bare compact opener, used on the Sessions list's row menu) sets its own `min-width` and `height` at (0,2,0) and wins today only by coming later in the file; `:where` keeps the specificity so `.opener.bare` still wins.
2. The 3px above and below a Sessions row are margins on the two lines inside the row button (`.one` margin-top, `.two` margin-bottom), not padding on `.row`, so a row being renamed (a field with no lines) is as high as the field (26px plus the form's 4px) and does not keep 6px of padding. The 6px at the sides is `RowButton`'s own `0 6px`.
3. `Band.svelte` `.lane-body` gets the `min-height` the brief lists for both lane copies; a Band column only draws with rows, so there it changes nothing.
4. The two list indents are 16px, not 20px (grep 3 reasons above).

## Limitations and sharp edges

- Nothing was measured on screen. The look at landing is the first measurement of every size below.
- The details line is a block of inline parts, so the separators sit between spans by the whitespace Svelte keeps between sibling elements (one space), where the flex gap of 4px was before. The gap between parts is one space instead of 4px (its width at 11px is not measured); the look at landing reads it.
- Under the terminal palette (`body.rice`) the small Move to opener keeps its filled form, as every opener does there; only the Commit button is bracketed.
- The third failure of the first case-11 run is not identified (see the cases section).

## Before and after for the look

At text size 100%, light theme unless said; pixel figures are arithmetic from the declarations.

| View and state | What should differ |
|---|---|
| Repositories view, a repo with staged changes, the commit row | The dropdown beside Commit is 26px high (was 20px), its top and bottom those of the Commit button, and hovering it keeps the accent fill (brightness up) where it painted the chip fill before. Check light, dark and the terminal palette, at rest and hovered; under the terminal palette the dropdown is as high as the bracketed Commit word (22px). |
| Sessions page, Changes panel, a session with changes, the commit row | The same dropdown, the same CommitBox. |
| Focus, command centre (the red-edged week block) | Block padding 4px 8px (was 10px 12px), corner 4px (was 8px), the two columns 16px apart (was 26px), each group 4px under the one above (was 9px), the title row's gap 8px (was 12px). The block is about 12px shorter plus 5px per group. |
| Focus, a ticker row's buttons | Same 22px height. The words (Ongoing, Completed, Done) are in the case `rows.ts` gives them, weight 400, no letter spacing, on the panel fill, not bold capitals on the chip fill. The kept button is always drawn, the others appear under the pointer, the keyboard walks them, and a narrow row cuts the name where they begin. |
| Focus, tasks block (teal edge) | The same changes as the command centre. |
| Focus, quick add | No change. |
| Focus, waiting panel | Padding 4px 8px (was 8px 12px), corner 4px (was 8px), gap 4px (was 8px): 8px shorter. |
| Focus, lanes (the three clusters) | The gap between a section and the next is 8px (was 14px). Lanes 8px apart (was 10px), 4px under the cluster heading (was 8px). A lane's padding is 4px 8px (was 8px), corner 4px (was 8px). The lane head is 22px (was 26px) with the name at 11px bold capitals (was 13px bold mixed case), one line with an ellipsis for a long label, the lane's fill and colours as before. The sub-line has 2px above and 4px below (was 4px and 6px). Cards are 4px apart (was 6px). An empty lane shows `Empty` at its own height. |
| Focus, a lane card | The first line is one 22px row (was 26px): the Move to button is 22px high at 11px (was 26px at 12px). A card with no second line is 24px (was 28px), with one 42px (was 50px), with two 60px (was 72px); the waiting and next lines are 18px lines (were 22px). Check a card with a long name and a deadline mark, which still wraps the mark. |
| Focus, Band columns (Funding, Jobs, Teaching) | The same lane padding, corner, head and gaps as the lanes. An entry's note is on an 18px line, so an entry with a two-line note is 60px (was 68px); a stage's label has 2px under it (was 4px) and the stage's entries 2px apart (were 4px). |
| Focus, career panel, open | The summary row is 4px 8px (was 8px 12px), the body 4px 8px (was 8px 14px 12px), a section label has 4px above and 2px below (was 10px and 3px), corners 4px (were 8px and 6px), the host body is `2px 8px 4px 24px`. The panel is about 20px shorter plus the section labels' difference. |
| Sessions list, five session rows | Each row is 40px (was 44px): an 18px title line (title 12px, was 13px) and a 16px details line (11px, was 12px). A group's rows touch, the groups separated by their heads only (the 4px gap between groups is gone). A row with no age shows the agent, the model, the files and the prompts with one separator between each and no empty slot. A 200-character title and a long details line are cut with an ellipsis in a 140px pane with no horizontal scroll. The selected row's details are in the selection ink. A row being renamed is as high as the field. |
| Sessions list, a terminal row | 40px (was 44px), the same two sizes, the working folder cut with an ellipsis on its details line. |
| Any of the above at text size 150% | Every changed line (the 22px, 18px and 16px lines, the 22px lane head, the small buttons' 14px line) scales by 1.5; the 3px margins and the other pixel paddings do not scale. |
| Files view and Repositories view, rows, section heads, field, primary button | No change beyond the commit dropdown: re-measure rows 22, section heads 22, the filter field and the message field 26, the primary button 26, and the root head after the first 28 on Files. |

## Full-list runs

One full-list run (`npm run diagrams` and checks.sh, exit 0, `checks: 7 commands passed`).
