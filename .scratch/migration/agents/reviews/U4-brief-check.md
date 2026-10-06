# U4 brief check

BRIEF CHECK OF U4 (brief: tools/oculus/.scratch/migration/agents/briefs/U4.md, tree on main at e97c71c1). Nothing was changed. No browser, no URL, no port, no .vscode, config/local.yml never opened; every config grep carried --exclude=local.yml.

Grep helper used for "Names": a scratchpad script running `grep -rnIE --exclude=local.yml --exclude-dir=node_modules,.svelte-kit,build,.git,.agents,.scratch,diagrams` over tools/oculus `src tests DESIGN.md HELP.md README.md config docs utils demo assets`. Line numbers below were read in this session.

## Names

1. tests/ui/primitives.test.ts:500-556 (describe 'Ticker') is outside "Paths this step writes" and item 2 makes it false. Lines 526-528 assert `'>1w<'`, `title="snooze 1w"`, `'>hide<'`; line 543 matches `/<button type="button" class="act([^"]*)"[^>]*>/` and reads the `kept` class; line 549 asserts `title="snooze 1w"` again. ToolButton draws `class="tool small ..."` and no `title` attribute: its `title` prop only feeds Tooltip's hidden `<span class="words">` (Tooltip.svelte, `<span {id} class="words" hidden>{text}</span>`). Case 4 and case 11 say the existing Ticker tests "pass unedited", and item 6 does not name this file. The test must change and the path list must gain it. Case 4 says "the existing Ticker and focus-rows tests", but focus-rows.test.ts does not render a Ticker (finding 1 under Premises).
2. tests/ui/theme/wall.test.ts:138 `'src/lib/ui/display/Ticker.svelte .act': 'a control, pressed to run what it names'` is in the SOLID list. The test compares the set of painted-and-unanswered selectors with `Object.keys(SOLID)` (`expect([...new Set(unpaired)].sort()).toEqual(Object.keys(SOLID).sort())`). `.act` paints `background: var(--chip)` (Ticker.svelte:428-442). Once `.act` is gone the entry is stale and the test is red. The brief names only wall.test.ts:119 "if the rule moves"; line 138 is not named. The file is in the paths, the line is not.
3. wall.test.ts:119 (`MenuOpener.svelte .opener.compact:hover`) and type-scale.test.ts:297-298 (`.opener.compact=fs-lg`) change only if the builder rewrites the compact selectors (for example `.opener.compact:not(.primary)`). Item 1 as written (`.opener.primary` overrides) moves neither. Item 6 covers both conditionally.
4. DESIGN.md:369 says "the sessions list (grouped by workspace, two 22 px lines per row, ...". Item 4 makes it false. DESIGN.md is in the paths, but the brief's locator `grep -n "Sessions view\|session list" DESIGN.md` prints lines 368 and 411, not 369 (line 369 says "sessions list"). A builder following the locator edits the wrong paragraphs.
5. tests/views/sessions/session-list.test.ts:2 (header comment "each row's two lines and state") is outside "lines 87-95, and new cases" and becomes false.
6. SessionWorkspace.svelte head comment lines 3-6 ("A row is two lines of the list's row height"), the comment at line 258 ("The selected row's second line") and the rule `.row.on .two` (line 259) are in the file the step writes. Verify command 4 (`grep -n "line two\|\.two"`) matches `.two` but not "two lines" (line 3) or "second line" (line 258), so a stale comment passes it.
7. src/lib/views/sessions/session-list/TerminalRows.svelte is not in the paths and stays two lines. It is drawn by the same `SessionList.svelte` (line 269-280 renders `<SessionWorkspace>` then `<TerminalRows>`), through the same RowButton, with `.top` and `.meta` each `height: calc(var(--tree-row) * ...)` (lines 125 and 203 area), so 44 px per terminal. DESIGN.md:369 and RowButton.svelte:5 name "session and terminal rows" together. After the step the Sessions list has one-line session rows above two-line terminal rows. The brief's premise "Every other list of oculus is one 22 px line per item" is false for this list.
8. Ticker.svelte script lines 112, 121, 125-126 (`one.classList.contains('kept')`) and 224-225 (`held.classList.contains('act')`, `held.parentElement?.children` index) read the `.acts` children and the `act`, `kept`, `name` classes. CSS rules 444-488 (`.reveal .act`, `.act:not(.kept)`, `li.open .act.gone`) read the same. Item 2's clause "the classes those rules read stay on the buttons or the rules move with them" names the CSS rules, not the script. ToolButton has no `class` prop (Props, ToolButton.svelte:13-127) and renders inside Tooltip's `span.tip` wrapper (ToolButton.svelte:170-221), so the direct children of `.acts` become `span.tip`. See Premises 12.
9. Lanes.svelte (style 328-382) and Band.svelte (style 184-216) each carry their own copy of `.lanes`, `.lane`, `.lane-sub`, `.lane-body`. Scoped CSS, so both need the same edit; no test ties the two copies together. Both files are in the paths.
10. Gallery.svelte:247-255 renders `<Ticker rows=...>` with no `onaction` and rows with no `actions`, so the Gallery draws no action buttons. Not made false, but case 5 has nothing to compare (see Cases).
11. Hits not made false: TreeActions.svelte:48,54 (`:global(.opener)`, `:global(.opener.bare)`, no primary); tests/views/boards/focus.test.ts:121,373,402 regexes on `class="lane-h`, `>${words}</span>`, `class="stage-block`, `class="lane `, which stay true while LaneHead keeps the `lane-h` first class and the `lane-name` span; tests/views/sessions/sessions.test.ts:525-632 and session-list.test.ts:84-130 count `data-session-row=`; tests/views/sessions/changes.test.ts:404 (CommitBox is also drawn by the sessions Changes panel, so item 1 changes that panel's dropdown too; the brief says only "Repositories").

## The step line

plan.md has no "Goal" section (`grep -n '^## ' plan.md` prints lines 5, 491, 502, 772: Packages, Could run in parallel, Rulings, Blocked). The goal used here is the step line (plan.md:187) and the U4 ruling (plan.md:503, matches the brief's copy).

1. "Focus view ... element by element against counterparts": items 2 and 3. Elements with no item and no measured value in the brief: CommandCenterView `.week` (padding 10px 12px, radius 8px, column-gap 26px, margin-top 9px, lines 215-250), Tasks `.tasks` (107-137), CareerPanel (many: padding 8px 12px at 271, 8px 14px 12px at 288, 5px 10px at 345, margin 10px 0 3px at 292, radius 6px at 322/348/393/416), QuickAdd. They are reached only by item 3's last bullet ("brought to the nearest of these measures"), which does not say what the nearest measure of 26px, 9px, 14px or 20px is. The brief's "counterpart" values are row 22, head 22, field 26, button 26, icon 20, small button 22 and the input radius. No counterpart exists in Files or Repositories for a bordered panel (lane, entry, waitroll, week), so lane padding 4px 6px, `.lanes` gap 6px, `.focus` gap 8px, waitroll 4px 8px, `.lane-body` gap 2px are choices of the brief, not measured counterparts. "Decisions taken in this brief" lists four decisions and none of these.
2. "Sessions view": item 4 reaches `SessionWorkspace` and the `SessionList` gap only. Not reached: TerminalRows (Names 7). The brief measured only the list; the other session views were not measured (U2-audit.md "session-detail": header 71.5 px at narrow). The brief does not state that it reads "the Sessions view" as the list only.
3. "Files and Repositories checked the same way": item 5 says "No change ... The report says so with the measures." There is no builder action that checks, and the builder has no browser (brief Conventions: "No browser test"; spec.md:14 forbids stating a measurement not taken). The measures in the brief came from the orchestrator's live page, light theme, 100% text size only. Item 5 as written asks the builder to report measures it cannot take.
4. "more-ways-to-commit control aligned with Commit": item 1, present.
5. spec.md:54 requires the report to carry a "before and after" section naming the view, the state and what should differ, which the look is read against. The brief's Report section (lines 107-109) lists no such section.

## Premises

Wrong or misleading:
1. "tests/views/boards/focus.test.ts and focus-rows.test.ts render Focus" (brief line 25): focus-rows.test.ts imports only `keptAction`, `rowMaker` from rows.ts and config (lines 8-14) and its header says "What this does NOT cover: the buttons shown under the pointer or the keyboard". It renders nothing. The only render of Ticker with `kept` and `reveal` is primitives.test.ts:531-550.
2. "each `.line` `height: --tree-row` (`:84`)": SessionWorkspace.svelte:84 is `event.stopPropagation();`. The rule is at line 276 (`grep -n tree-row SessionWorkspace.svelte` prints 205 and 276).
3. "`SessionList.svelte` `.rows` gap 4px" is read as spacing between sessions. The children of `.rows` are one `section.group` per workspace plus TerminalRows (SessionList.svelte:269-280); rows inside a group have no gap (`.group` is a flex column with no gap). Gap 0 changes the space between workspace groups and the terminal group only, not any session row.
4. Rice, case 2 "the dropdown keeps its bracket form": MenuOpener.svelte has no bracket rule. `:global(body.rice) .opener.primary` (line 163) repeats the filled accent form. Brackets exist only in ToolButton.svelte:511-521. Under rice the Commit button is the one that differs: `:global(body.rice) .tool` (ToolButton.svelte:494-499, specificity (0,2,1)) beats `.tool.primary` (0,2,0), giving border 0, background none, padding 3px 4px, so Commit is 22 px, bracketed, unfilled, beside a filled 26 px dropdown. Stretch (`.acts` `align-items: stretch`, `.tip` flex) makes the edges equal once the dropdown's fixed height goes and its padding is 4px, but case 2's wording is false and the two forms stay different.
5. Z180 is cited as a booked decision (brief lines 40 and 79). `grep -rn "Z180" tools/oculus/.scratch` prints only U4.md; it is not in plan.md Rulings, choices.md, queue.md or orchestrator-state.md. The automode rule (orchestrator-state.md:80) requires booking in the closed log, plan.md Rulings and choices.md.
6. Z180's reason, "as every other list in oculus and VS Code's lists draw a name and its description": the VS Code list S2 was copied from is two rows. U2-vscode.css:1067 has `.agent-session-item{padding:8px 6px}`, `.agent-session-title-row{line-height:17px;padding-bottom:4px}`, `.agent-session-details-row{font-size:12px;line-height:15px;max-height:15px}`. U2-audit.md (section session-list) records "Better and kept: a session row shows title, meta, status dot and 'needs input' in two lines, which a 22 px row cannot". U3.md:50 says "a two-line item growing by whole lines" and U3 landed that. spec.md:78 says oculus things that are kept are listed in the brief and "a build that removes one is not landed". The brief lists none. Axel's U4 ruling says Sessions is too large, so this is a clash between a kept item (audit approved through Z146) and a later ruling; orchestrator-state.md:80 leaves clashes and reversals of Axel's rulings to him, not to automode. The brief should surface it as an open item (options: one line per session as Z180; two lines at VS Code's own 17/15 px metrics; two lines kept with the ruling answered elsewhere), not bake it in.
7. "`.card` 50 px for a one-line card" (brief line 21): the CSS gives 50 only for a card with one `.wait` or `.next` line (2 border + 26 + 22); a card with neither is 28, with both 72.
8. Cause of the 26 px first line, not named in the brief: LaneCard.svelte:117 `<Menu label={t('focus.move_to')} {items} placement="down" {onpick} />` has no `compact` and no `glyph`, so MenuOpener `.opener` draws the words "Move to" in a text button: padding 4px + 16 px line + 4px + 2 border = 26 px, at opacity 0 at rest but in the flow (`.move`, opacity: var(--row-reveal)). Item 3 "every child at most 20 px" can hold only if this Menu becomes `compact` with a glyph, an icon in place of the words "Move to". That is a user-visible change (config/text/views/boards/focus.yml:102, DESIGN.md:404 "Move to menu") not listed as a decision, and it needs LaneCard markup, which item 3 allows only "where item 2 or 3 needs it".
9. Item 3 "height, not min-height" on `.card-h` conflicts with `.card-h { flex-wrap: wrap }` (LaneCard.svelte:162) and the `.mark` comment ("a row with no room left for it wraps the mark to the next line rather than cutting its word"). A wrapped second line overflows a fixed row. Lanes are `minmax(min(290px,100%),1fr)` wide; flames, up to two status tags, name, due tag and menu can wrap.
10. Item 1: `.acts` already has `align-items: stretch` and `Tooltip`'s `.tip` is a flex container (Tooltip.svelte:300-309), so removing the dropdown's fixed height is enough for the button to stretch; `align-self: stretch` and `min-height: 0` are redundant (no min-height rule exists), and CommitBox.svelte needs no change. CommitBox cite "198-215" is 199-217 (`<ToolButton` at 199, `/>` at 217).
11. Item 1 leaves a defect: `.opener.compact:hover` (MenuOpener.svelte:139, specificity (0,3,0)) sets `background: var(--chip)` and ink colour; `.opener.primary:hover` (line 176, same specificity, later) sets only border-color and filter. Hovering the dropdown therefore turns its accent fill into the chip fill. Item 1 says the compact rules "no longer apply" but lists only the 20 px height and `--fs-lg`; the hover rule is not removed.
12. Item 2 against the Ticker script: direct children of `.acts` become `span.tip`, the button inside has no `act`, `kept` or `gone` class, so `room()` (line 126) finds no kept button, `roomAt()` (224-225) returns index -1 for the focused button (the "button holding the keyboard is never taken back" rule at lines 21-24 breaks), and the `display:none` rules (469-488) on the button would leave an empty `span.tip` per hidden button as a flex item of `.acts` (`gap: 6px`, line 425), so a closed row reserves (n-1) x 6 px beside the name. The hiding must sit on a wrapper the Ticker owns. Also `.tool.small` does not do "sentence case" (it has no text-transform); the words are whatever `rows.ts` passes (status words from data, `project.action.*` catalog words). The native `title` becomes the 150 ms Tooltip.
13. Brief line 27: "D27's and D35's briefs name none of this step's files": true for components and tests; all three in-flight briefs (and U4) name DESIGN.md, HELP.md and docs/diagrams/. DESIGN.md lines: Q85d 148 and 323, D27 85/171/379, D35 224-235, U4 369/408; HELP.md lines: D27 230, D35 216/236, U4 100. No line overlap found; diagrams are regenerated by all four. (`grep -c SessionWorkspace Q85d.md` prints 0, as the brief says; Q85d's script lines SessionList.svelte:95-97, Band.svelte:72-77, CommandCenter.svelte:62-64,147,207-212 were read and match.)

Checked and true (command: read of each file with line numbers):
14. tokens.css:124-128 (11, 12, 13, 14, 16 px, times scale); `--tree-row: 22px` unscaled (line 142), `--header-action` 20 x scale, `--button-line` 16, `--input-radius` 4px, `--radius-sm` 6px.
15. Pixel values vs CSS: `.tool` 26 = 16+8+2 and `.tool.small` 22 = 14+6+2 (ToolButton.svelte:226-247); `.tool.compact` 20; dropdown 20 beside 26 (MenuOpener `.opener.compact` height 20 px, `.opener.primary` sets none); Ticker `.act` 22 with 11 px, 700, uppercase, 0.04em (Ticker.svelte:428-442); `.lanes` gap 10 / margin-top 8, `.lane` 8px / radius 8, `.lane-sub` 4px 0 6px, `.lane-body` gap 6 / min-height 26 (Lanes.svelte:328-382); lane head 26 = 3+3+19.5 where 19.5 = 13 px x body `font: var(--fs-md) / 1.5` (routes/+layout.svelte:30-35); Band `.entry` 68 = 2+22+2x22 for a two-line note; `.focus` gap 14, waitroll 8px 12px / 8px / gap 8 (Focus.svelte:190-211); session row 44 = 2 x 22; `.row.apart { padding-top: 6px }` Tree.svelte:514 (class at 391). The 26 px lane head and card line, and all Files and Repositories heights (22, 26, 19), come out of the CSS as stated or as explained in 7 and 8; the Files and Repositories values were not re-derived (no browser).
16. Test lines: session-list.test.ts:87-95 is the 'draws each row as two lines' case; wall.test.ts:119; type-scale.test.ts rows 64, 119-129, 193-195, 297-298, 311.

## Cases and checks

1. Case 4 and 11 ("existing Ticker and focus-rows tests pass unedited") cannot hold: primitives.test.ts:526-549 must change (Names 1). Case 4's hiding behaviour (opacity, display none) cannot be seen by a server render, and no look instruction covers the keyboard walk or the narrow-row measurement.
2. Case 5 is vacuous: the Gallery Ticker has no actions (Names 10), so "renders with the same buttons" compares nothing; the new look is not visible in the Gallery under any theme.
3. Case 7 cannot fail: type-scale.test.ts `typeRules()` reads only `font-size: var(--fs-*)`; the row `.wait, .next=fs-sm` is unchanged by an 18 px line-height change.
4. Case 6: "colour tokens unchanged (contrast and lane-distance tests pass unedited)" passes before and after by construction (LaneHead sets `--lane`/`--lane-txt` in the script template string); "section-head style" is a CSS fact a render cannot show. The type-scale edit `.lane-title=fs-md` to `fs-xs` is a source audit (spec.md:57: reported as an audit, never as coverage).
5. Cases 1, 3 (second clause: no `text-transform: uppercase` in Ticker.svelte) and the CSS halves of 10 are readings of source text. As reading by the builder, and verify command 2, they are acceptable; written as unit tests they are source-text assertions that pass with the behaviour removed (spec.md:57).
6. Case 2: false premise (Premises 4).
7. Case 9: no existing test renders a renamed row. `grep -rn "data-rename\|rename_field" tests` prints nothing, and sessions.test.ts:428 says "the rename itself is not seen here" (renaming is local state of SessionList). "Existing tests pass" covers the pin (session-list.test.ts:149) and the input tag (sessions.test.ts:526) only.
8. Case 10, "an empty lane keeps its body at one row's height": an empty lane renders `Empty` (Lanes.svelte, `{:else}` branch) whose `.empty` has a 16 px glyph, gap 6, a 13 px message and `padding: 0 20px 1em` (Empty.svelte style), about 55 px; under rice `padding: 10px 0`. `.lane-body { min-height }` is a minimum, so the case's expected result is not what the CSS gives. Not renderable on the server.
9. Case 10, "a Ticker row with no actions draws no action box": true for `actions` undefined; for `actions: []` Ticker.svelte `{#if onaction !== undefined && row.actions !== undefined}` still draws an empty `<span class="acts">`. `actionsFor` (rows.ts:86-125) never returns an empty array, so the case should say which input it means.
10. Verify command 3 (`padding: [0-9]*[1-9][0-9]px|border-radius: (8|10|12)px|gap: (1[0-9])px`) does not print `padding: 8px 12px` (Focus.svelte:206, CareerPanel.svelte:271), `padding: 8px 14px 12px` (288), `padding: 5px 10px` (345), `padding: 2px 10px 7px 26px` (465), `margin: 10px 0 3px` (292), `column-gap: 26px` (Tasks 113, CommandCenterView 222), `margin-top: 9px` (Tasks 137, CommandCenterView 249) or `border-radius: 6px` (CareerPanel 322, 348, 393, 416). It can print nothing while item 3's last bullet (every padding, gap, margin and radius above 8 px, and any radius other than `--input-radius`/`--radius-sm`) is unmet. Current output of the same grep: Focus.svelte:191,208; CommandCenterView.svelte:216,219,233; CareerPanel.svelte:258; Band.svelte:186,197; Tasks.svelte:107,110,124; Lanes.svelte:330,345.
11. Verify command 4 passes if `.two` is renamed and the row stays two lines.
12. Item 3 `.stage` margin `4px 0 2px` with `.stage-block` gap 2px is net zero: before 4 (margin) + 4 (gap) = 8 px between a stage label and its first entry area; after 4 above + 2 + 2 = 8 px. The Band funding column's stage spacing does not shrink.

## The question (could it pass without Focus and Sessions at the other views' size, the dropdown aligned)

1. Case 1: low risk; reading the rules shows the cause and the stretch follows from `.acts`/`.tip`. It does not show hover (Premises 11) or the rice form; the landing look is the proof.
2. Case 2: yes, passes whatever the CSS does (false premise).
3. Case 3: passes with the buttons drawn through ToolButton even if the reveal is broken (Premises 12). Item 2 also does not change any size (22 px before and after); its goal is the shouted-chip look.
4. Case 4: yes; a server render sees neither opacity nor `display: none`, so it passes with the reveal removed.
5. Case 5: yes, vacuous.
6. Case 6: yes, colours are unchanged by construction and the size is not rendered.
7. Case 7: yes, cannot fail.
8. Case 8: yes; counting `class="line` and zero `line two` passes with the row still two visual lines (a wrapped description, a kept height). Row height is only the landing look.
9. Case 9: yes, passes with a two-line row.
10. Case 10: yes except the no-model separator case, which a render can show.
11. Case 11: yes; only says nothing broke.
12. Items: item 1 reaches the goal if the look measures both boxes under light, rice and hover. Item 3's numbers are the proxy; verify 3 passes without them (finding 10 under Cases). Item 4's verify 4 passes without a one-line row. Item 5 is a statement with no check. Nothing in the brief proves "Focus at the other views' size" except the landing look, and the brief's Report has no before and after section to read it against (The step line 5).

## Implied inputs

1. Text scale above 1: item 3 writes `.wait, .next` as "an 18 px line" with no scale; at scale 1.5 the type is 18 px on an 18 px line. Expected: `calc(18px * var(--text-scale, 1))`. A non-compact Move-to opener at scale 1.5 is 16x1.5+8+2 = 34 px against a 33 px row. Case 10 names scale 1.5 only for the scaled row.
2. Rice (terminal palette): Ticker small buttons become bracketed words (padding 3px 4px, 20 px high in a 22 px row, `::before`/`::after` brackets widen them, `room()` measures them). Expected: reveal and cutting still work. The dropdown/Commit mismatch of Premises 4 remains. SessionList uses `--font-mono` under rice, so descriptions are wider; the type scale is one step down.
3. Wall (wallpaper): ToolButton `.tool` is already a SOLID entry, so Ticker buttons stay solid; wall.test.ts:138 must go (Names 2). `.lane` and `.entry` have wall answers and need no change.
4. Narrow panes: `.card-h` wrap vs fixed height (Premises 9); expected one line with the name cut by its ellipsis. LaneHead `.lane-title` has no overflow or ellipsis and item 3 fixes the head at one row; a long lane label wraps or overflows; expected one line with an ellipsis. A session row in a pane around 140 px (U2 notes record such panes): dot 8 + gaps + 12 characters of title + pin + tag + 20 px menu + 6+6 padding + 2 border exceeds the width; expected: clip, no wrap, no horizontal scroll. "Cut first" is undefined: ellipsis or hidden. The description is a run of spans inside a flex `.line`/`.two`; `text-overflow` does not apply to flex children, so an ellipsis needs a block or inline container.
5. Touch: `@media (hover: none) .reveal .act { opacity: 1 }` (Ticker.svelte:454-458) and the `@media (hover: hover)` `display: none` rules must move to the wrapper (Premises 12). Expected: on a device with no hover every button is drawn at full opacity; on finger-plus-pointer the first tap opens the row, the second presses (the `tap()` / `reveals()` flow). Hit size stays 22 px.
6. Keyboard in a Ticker row: Tab walks the buttons in markup order and the focused one is never taken back by `room()` (Premises 12). No test covers it (server render only; the effect timing needs a `*.client.test.ts`, spec.md:58), so the brief should say it is seen at the look.
7. Empty lane: Empty is about 55 px (Cases 8). Expected result must be chosen: the body keeps Empty's height, or Empty is made compact.
8. Long titles: session title 200 characters (named in case 10); a card name (ToolButton `cut`) and a Band entry name already cut; Ticker name cut by `.name`.
9. Sessions with missing fields: no model (named). No age: `since()` (SessionWorkspace.svelte:59-66) returns '' when `ago()` is null, and the markup draws `sep`, an empty span, `sep`, a double separator. Expected: no empty slot. Zero files and zero prompts draw "0 files" and "0 prompts" today; keep. Empty title draws an empty name.
10. Row states: `.row.on` (selected) needs the description in the selection ink (`.row.on .two { color: inherit }`, line 259, moves with the class); `.row.away` opacity .6; `.row.input` amber left border; the `.row:hover` SOLID entry (wall.test.ts:162) stays valid while the selector stays.
11. Rename: TextInput (26 px) plus `.rename` padding 2px 6px (lines 313-317) is about 30 px in a 22 px row. Item 4 says "sit in the one line". Expected: the row is 30 px while renaming (was 44), or the field is sized to the row; the brief must pick.
12. Commit dropdown states: hover (Premises 11), focus-visible (outline inside the box), open (`aria-expanded`), disabled Commit with a live dropdown, text scale 1.5 (both boxes use the same formula, 34 px), and the same CommitBox inside the sessions Changes panel.
13. Move-to menu (Premises 8): if it becomes an icon, the tooltip and accessible name stay `focus.move_to`; expected result must be stated.

## ADRs

1. `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both; `ls tools/oculus/docs` prints `diagrams` only; `grep -n adr tools/oculus/.scratch/migration/orchestrator-state.md` prints nothing. The brief's statement is true. No ADR touches the step.

## Declined to judge

1. Whether one line per session (Z180) is the right design against the VS Code and audit record in Premises 6: Axel's decision.
2. The numeric spacing choices of item 3 (6px, 4px 6px, 2px, 8px) as design: no counterpart exists to measure them against.
3. Live pixel values for Files and Repositories (22, 26, 19) and whether they are "a little too large": no browser, and no VS Code 1.137 stylesheet was compared in this check beyond U2-vscode.css.
4. How the rice dropdown should look beside the unfilled bracketed Commit button.

## Usage

claude-sonnet-5-5 (served, checked in the subagent record), 306,765 tokens, 84 tool uses, 14.6 min.

## Closed

Each finding is closed by a change to `agents/briefs/U4.md`, re-read on main at 8be281e8.

Names
- 1, 2, 8: item 2 keeps the Ticker's own `.act` button, its classes and title, and changes only its look, so the script, the reveal rules, `primitives.test.ts:500-556` and `wall.test.ts:138` stay true (decision 3).
- 3: item 7 names `wall.test.ts:119` and the type-scale rows conditionally on the selector the builder writes.
- 4: the brief names `DESIGN.md:369` directly.
- 5, 6: item 5 keeps two lines (decision 1), so the head comments stay true; item 5 has the comment at `:258` restated.
- 7: `TerminalRows.svelte` joins item 5 and the paths.
- 9: item 3 names both copies of the lane rules.
- 10: case 5 of the old brief is gone.
- 11: the sessions Changes panel is named in item 1 and case 1.

The step line
- 1: item 3 gives every value, the panels' values as decision 2, with each line the check listed.
- 2: the brief states that "the Sessions view" is the Sessions list, session and terminal rows.
- 3: item 6 leaves the measuring to the landing's look; the builder states no measure.
- 4: no change needed.
- 5: the report gains "Before and after" for the look.

Premises
- 1: `focus-rows.test.ts` is named as rendering nothing; case 2 names `primitives.test.ts`.
- 2: the line is `:276`.
- 3: the `.rows` gap is described as between groups.
- 4: case 1 and item 1 describe the rice forms as they are; equal height through the stretch.
- 5, 6: Z180 is an open item for Axel in the state file, not an automode decision; the step keeps the kept two-line row at VS Code's own two-row size.
- 7: card heights 28, 50 and 72 stated.
- 8: the Move to menu is the cause; item 4 gives it a small opener with its words kept (decision 4).
- 9: `.card-h` keeps `min-height` and its wrap.
- 10: item 1 drops the redundant stretch rules and leaves `CommitBox.svelte` unchanged unless shown otherwise; the cite is 199-217.
- 11: item 1 excludes the chip hover from the dropdown.
- 12: closed with Names 8 (no `ToolButton` inside the Ticker; no text-transform claimed of `.tool.small`).
- 13: the shared docs lines are listed.

Cases and checks
- 1, 2, 5, 6: cases rewritten; the Ticker tests pass unedited; the Gallery case is gone; colour and size claims are the look's.
- 3, 4: cases that cannot fail are gone or named as audits and readings.
- 7: the rename row takes the field's height (item 5); no rename case claimed of existing tests.
- 8: an empty lane keeps `Empty`'s height (item 3, case 10).
- 9: the no-actions case is gone.
- 10: verify 3 is widened to 9 px and above in padding, margin and gaps, and radii 6 to 12.
- 11: verify 4 of the old brief is gone with the one-line row.
- 12: `.stage` margin `0 0 2px` and gap 2px, 4 px against 8 today.

The question
- Every size, hover, reveal and palette claim is the look's, read against the report's "Before and after"; the cases that can be rendered are kept as renders.

Implied inputs
- 1: every changed line height is scaled. 2: rice named in item 1 and case 1. 3: wall needs no change (item 7). 4: ellipses and no wrap named in items 3 and 5, case 9. 5, 6: the reveal is untouched (item 2), seen at the look (case 3). 7: Empty's height (item 3). 8: case 9. 9: no-age row (item 5, case 7). 10: states kept (item 5). 11: rename row (item 5). 12: hover, palette and the Changes panel (case 1). 13: Move to keeps its words and name (item 4).
