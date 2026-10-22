# Step O52 brief check (on main at ad6e6685)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O52.md`. Nothing was written or edited. `git log --oneline -1` printed `ad6e6685 Book O54's stop, open item 223`. `git status --short` shows the brief untracked and `plan.md` and `orchestrator-state.md` modified in the main checkout, so I read them as they stand on disk.

Eight findings, all inside the step's line. One of them (F6) would widen the step if it were fixed with a new text key. The two findings that matter most:
- **F1:** C1's grep can never print nothing, so the builder's Verify item 4 will be red even when the work is right.
- **F2:** the geometry the brief dictates for `FoldHead` does not cut a long career line. The line wraps under the fold circle instead, and C4's reading check cannot see this.

## 1. Names

- `FoldHead`: `git grep -n 'FoldHead' -- . ':!config/local.yml'` printed nothing (exit 1). No hit outside the paths.
- `class="head"` and the `.head` / `.head > b` rules: `git grep -n 'class="head"' -- src docs README.md ':!config/local.yml'` printed 28 hits. Outside the two step files they are in PageLeaf, NoticeCentre, Latex, Grid, literature/Head, SessionWorkspace, TerminalRows, AttachPicker, TaskBlock, Transcript, Tree, FolderFiles, RecoverLog, CommentBox, HunkBar, GraphHead, Merge, MergeSide, Repo, Map, History, Debug (x3) and settings/Item. Each of those components scopes its own `.head` rule (Svelte scoped style), so removing the rules in `CommandCenterView.svelte:304-319` and `Tasks.svelte:130-145` makes none of them false. The one `:global(.head)` is `src/lib/views/boards/entry/EntryFolder.svelte:146` `.files :global(.head) {`, which targets FolderFiles inside EntryFolder and is not false.
- `<details class="career">`, `<summary>`, `.career > summary`, `.career > summary > b`: `git grep -n 'career > summary\|class="career"\|\.career\b' -- . ':!config/local.yml' ':!.scratch'`. Every UI hit is in `career/CareerPanel.svelte` (106, 256, 265, 270, 277, 286). The other hits are data and state code reading `entities.career` or `config.career`, which is a different name and not touched.
- Comments that name the three files, found with `git grep -n 'CareerPanel\|CommandCenterView\|focus/Tasks' -- src tests`:
  - `src/lib/views/boards/focus/career/CareerHosts.svelte:2` `// Layer 3, view partial of views/boards/focus/career/CareerPanel.svelte. The host pipeline: one`: not made false.
  - `src/lib/views/boards/focus/career/CareerPanel.svelte:254` `/* Drawn in the command center's box (CommandCenterView.svelte `.week`), with its own edge`: in the paths, and still true after the padding is added.
- Focus.svelte head comment (outside the paths):
  - `src/lib/views/boards/focus/Focus.svelte:21-27` "the markup is six partials under views/boards/focus/ ... The command center and the tasks section fold, each by a control on its heading ... The career banner folds by itself and starts folded." `FoldHead` is a partial of partials, as `CommandCenterView` and `CareerHosts` already are, and `unfolded` stays local. Not made false.
- Docs and tests:
  - `docs/HELP.md:282` (outside the paths), "The career banner is folded to one line ... A hub with no career file has no banner.": not made false.
  - `docs/diagrams/channels.dot:132` names only the folder `views/boards/focus`: not made false.
  - `git grep -n 'Tasks.svelte\|CareerPanel\|CommandCenterView\|FoldHead\|boards/focus' -- tests` printed only `config-folder.test.ts:264`, `allow-duplication.txt:18-19` (Lanes) and `boundaries.test.ts` rows (Focus, CommandCenter, Row). None names the three files or the changed rules.
- Props: the brief names `FoldHead`'s props only by meaning (glyph, title words, fold words, open, toggle, end-of-row snippet), so there is no new prop name to grep. `open` and `ontoggle` are the existing `SectionProps` names (`Tasks.svelte:23`, `CommandCenterView.svelte:34-35`), which the step does not rename.

Findings: none.

## 2. The step line

- "the Focus board's section headings take one shape": item 1 (`FoldHead`) with items 2, 3 and 4.
- "the Career strategy, Command center and Tasks headings draw their fold circle, their glyph and their title at the same places": items 2, 3, 4 and 5.
- "and the same height": items 4 (`padding: 4px 8px`) and 5 (22 px).
- "career circle at x 79.3 against 82.3": item 4 (a bare `ToolButton` in place of a bare `Glyph`, and the box padding) and item 5.
- "its glyph at 108 against 116.6 (Command center) and 112.6 (Tasks)": item 1 (`gap: 8px`), item 3 and Decision 3.
- "its row 26 px high against 22": items 4 and 5.
- "the career heading draws a bare glyph inside a `<summary>`": item 4.
- "the other two a bare `ToolButton` in a `.head` row whose gap is 8 px ... and 4 px": items 1, 2 and 3, and Decision 3.
- (ruling Focus headings): item 1 ("the command center's geometry today") and Decision 3.
- (ruling O49 to O63 by agents) and (ruling Parallel order): process rulings that give no requirement and need none.

Brief items that do not name where they come from:
- C1 to C8: none names a source (Axel's words, a ruling or the step line).
- "What it must do": no source.
- Verify 1, 2, 5 and 7 follow `spec.md` sections ("Token discipline", "The principles every package is judged on", the test rule) without naming them. Verify 4 rests on the cases. Only Verify 3 and 6 name `spec.md`.
- Item 1's "a title longer than the row is cut with an ellipsis", applied to all three titles: this comes from the career's existing summary style (`CareerPanel.svelte:286-292`), not from the line or a ruling.
- Decision 2 gives its reason, not a source. That is acceptable for a Decision.

Findings (inside the step's line): the cases, "What it must do" and Verify 1, 2, 4, 5 and 7 name no source. No part of the line lacks a requirement.

## 3. Premises

- Step line and ruling quotes: compared by shell, `[ "$a" = "$b" ]` printed `SAME` against `plan.md:671`. The ruling text matches `plan.md:2405`. Matches.
- CareerPanel facts:
  - `cat -n career/CareerPanel.svelte`: 106-113 is the `<details>`/`<summary>` as described; 81 `let unfolded = $state(false);`; 87-98 `summary`; 256-261 `.career` with 1 px border, 3 px left border and no padding; 277-284 `.career > summary`; 286-292 the ellipsis. Matches.
  - Detail: 277-284 also holds `cursor: pointer;`, which the brief leaves out. Harmless.
- CommandCenterView facts:
  - `.head` 304-310, `.head > b` 311-319 and `.week` 283-291 match.
  - Detail: the heading markup spans 136-159 (`</div>` at 159); line 160 is `{#if open}`.
- Tasks facts: `cat -n Tasks.svelte`: 77-88, `.head` 130-136 (`gap: 4px;` at 134), `.head > b` 137-145 and `.tasks` 109-117. Matches.
- Fold words: `grep -n 'fold\|unfold' config/text/views/boards/focus.yml` printed `90: fold: Fold {0}` and `125: unfold: Unfold {0}`. `grep -n career ...` printed only `career_caveat`, `career_glyph`, `career_next`, `career_rules`, `career_score_tip`, `career_shots` and `career_situation`, so there is no heading word. Matches.
- Users of the three files: `git grep -n 'CareerPanel\|CommandCenterView\|focus/Tasks' -- src tests` printed `CommandCenter.svelte:29`, `:237`, `Focus.svelte:37`, `:168`, `CareerHosts.svelte:2` and `CareerPanel.svelte:254`. Differs from the brief:
  - The command does not print `Focus.svelte:41`, because the import is `'./Tasks.svelte'`. `git grep -n 'Tasks.svelte' -- src` shows `Focus.svelte:41: import Tasks from './Tasks.svelte';`, so the fact is true but the quoted command does not show it.
  - It prints two comment hits the brief does not list.
- "No test imports them": the tests grep in section 1 printed no importer. Matches.
- Documents:
  - `docs/HELP.md:282`: the brief's quote is the last two sentences of a longer bullet. The words match.
  - The CareerPanel comments at 2-18 and 275-276 match.
  - `ls DESIGN.md` printed "No such file or directory".
  - `grep -n -i 'career\|command center\|heading' README.md` printed nothing.
  - Matches.
- guarded.md: `grep -n 'CareerPanel\|CommandCenterView\|focus/Tasks\|boards/focus' .scratch/migration/agents/guarded.md` printed nothing (exit 1). guarded.md's header also says "Views have no entry: the look on TEST covers them." Matches.
- Folder rule: `tests/checks/tree/size.test.ts:14` holds the folder-rule comment. `ls src/lib/views/boards/focus | wc -l` printed 9, and `git ls-files` over the folder also gives 9 tracked items. Matches.
- ADR and glossary: `ls docs/adr` and `ls docs/glossary.md` both printed "No such file or directory". Matches.
- Base copy: `ls .agents/worktrees/` lists only `migration-O59*` and `migration-O62*`. The brief says the O52 copy is made at preparation, so this is consistent.

Findings (inside the step's line):
- F9: the users premise's command omits `Focus.svelte:41` and prints two comment hits the brief does not list.
- F10: minor line and quote details: the heading markup spans 136-159, not 136-160; `cursor: pointer` is left out; the `HELP.md:282` quote is a partial sentence of the bullet.

## 4. Cases and checks

- C1: inconsistent with the tree. `grep -n "<summary\|<details\|class=\"head\""` over the three files printed, on main, `CommandCenterView.svelte:262: <details class="grp">` and `:263: <summary class="lbl"` (the Snoozed group, which the step does not change), besides the heading lines. After a correct build it still prints those two lines, so "prints nothing" cannot hold, and Verify 4 quotes it.
- C2: consistent. `grep -rn "gap: 4px\|gap: 8px"` printed only `CommandCenterView.svelte:308` and `Tasks.svelte:134`.
- C3: a press and Enter/Space are DOM behaviour. `spec.md`, "What every package obeys", says such a behaviour "is seen at the look on landing ... such a DONE row names the look as its proof". The case says only "Checked by reading". It also asks the builder to check `ToolButton.svelte`, a place the step does not change.
- C4: the ellipsis is drawn behaviour, so the same `spec.md` rule applies: its proof is the look, not the reading alone. See also F2.
- C5 to C8: consistent with `spec.md`.

Findings (inside the step's line):
- F1: C1's `<details|<summary` grep can never print nothing, because of `CommandCenterView.svelte:262-263`. Narrow that part to `career/CareerPanel.svelte`, or grep `<details class="career"\|<summary>` there and `class="head"` over the three files.
- F8: C3 and C4 say "Checked by reading" where `spec.md` requires the look on landing as the proof of a DOM behaviour. C3 also asks the builder to check `ToolButton.svelte`, which the step does not change.

## 5. The question

- C1: as written it fails even when the goal is reached (F1). Its "shows each drawing it" half could pass on an import line alone, without `FoldHead` being rendered.
- C2: yes, it could pass without the goal. It shows the gaps are gone from two files but says nothing of where the three rows actually stand.
- C3: no, as long as its proof is the look.
- C4: yes, it could pass without the goal (F2). Item 1 dictates a title `<b>` that holds the glyph, with `display: flex` (as `.head > b` does today), in a row with `flex-wrap: wrap`.
  - CSS `text-overflow` applies to a block container, not a flex container, and the anonymous text item keeps its min-content width under `nowrap`.
  - In a wrapping row, a title wider than the space left after the fold circle moves to a second line before it shrinks.
  - So a long career line wraps under the fold circle (two rows, no longer 22 px) rather than being cut. A reading of `text-overflow: ellipsis` in `FoldHead.svelte` passes all the same.
  - Today's career summary has no `flex-wrap`, and its `b` is a plain flex item with `min-width: 0` (`CareerPanel.svelte:286-292`), which is why it cuts.
- C5 to C8: no. Each reads markup the step keeps.
- The check on the step's line (the look on TEST, measuring x and height): no, with one gap. It measures only the panes and career line TEST shows. In a pane narrower than the career line it would pass on TEST while the row wraps elsewhere (F2).
- Items 1 and 5: yes, they could pass, for the same reason as C4.
- Items 2 and 3: no.
- Item 4: yes, it could pass while the step changes unfolded-panel behaviour the goal keeps (F3, F4).

Findings (inside the step's line):
- F2: item 1's row geometry (`flex-wrap: wrap`, plus a flex title that holds the glyph) does not cut a long career line, and neither C4 nor the look on a wide TEST pane would show it. Item 1 should put the title's words in their own element that shrinks (`min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis`) and keep it on the fold control's line. C4's proof should be the look in a pane narrower than the career line.

## 6. Implied inputs

This is a code step. Inputs the step implies that the cases do not cover:
- A career line longer than the pane. C4 names it, but its check cannot fail (F2). Expected: one 22 px row, the fold circle, glyph and cut title on one line.
- A pane narrower than the command center's title plus its HPC pill. Missing. It happens on any narrow pane, and the ellipsis item 1 gives every title changes how this row breaks. Expected, as now: the title whole and the pill wrapping to a second line, or the brief states the new behaviour as a decision. (F5, inside the step's line.)
- Folding the career banner while its editor shows a refusal or a save is in flight. Missing (F3, inside the step's line).
  - Item 4 says the body "is drawn only while `unfolded` is true, as the `<details>` drew it". That is wrong about `<details>`: a closed `<details>` keeps its children mounted and only hidden.
  - With `{#if unfolded}`, `EntryEditor` is unmounted on fold, and its local `let result = $state<string[]>([]); let refusals = $state<Record<string, string>>({}); let saving = $state(false);` (`EntryEditor.svelte:64-66`) are lost.
  - `spec.md` requires the asynchronous path "in flight, after close" to be checked.
  - Expected, as now: after fold and unfold, the refusal under a field and the save's outcome words are still shown. That means the body stays mounted and is hidden while folded, or the brief states the change as a decision.
- The unfolded panel's inset. Missing (F4, inside the step's line). `.body { padding: 4px 8px; }` (`CareerPanel.svelte:294-296`) stays while item 4 gives `.career` `padding: 4px 8px`. The body's content would move from 11 px to 19 px from the box's outer left edge, against "Nothing else on the board changes". Expected: the body's content stays where it is now, so item 4 should say what `.body`'s padding becomes.
- A career file with no title, no milestone and no host in flight, which leaves `summary` as `''`. Missing. The normaliser allows it: `title: str(raw.title) ?? ''` in `normalise-parts/career.ts`, whose doc says "a half-filled career file draws the half it has". The fold control is then named and tooltipped "Unfold " with no object. Expected: a name that says what it folds. (F6.) The case is inside the step's line. Fixing it with a heading word means a new key in `config/text/views/boards/focus.yml`, which is outside the paths and against Decision 2: that fix **widens the step**.
- Hovering over the career fold control. Missing from the before-and-after list (F7, inside the step's line).
  - A bare `ToolButton` shows its label as a tooltip (`ToolButton.svelte:52-53`, `const iconOnly = $derived((compact || bare) && ...); const tip = $derived(title ?? (iconOnly ? label : ''));`), so the career control gains a tooltip "Fold <whole career line>" / "Unfold <whole career line>".
  - Separately, a click on the title no longer toggles the banner. The report section lists this change, but "Decisions" does not, and `spec.md`'s "No silent design decisions" asks for it to be stated.
- Covered: no career file (C7), no HPC pill (C5), wallpaper (C8), Enter/Space (C3). A terminal palette needs no case, because `body.rice .tool.bare` (`ToolButton.svelte:220-221`) draws the same box for all three rows.

## 7. ADRs

- `ls docs/adr` printed "ls: docs/adr: No such file or directory". No record.

Findings: none.

## 8. Dictated text

The brief dictates CSS declarations for `FoldHead` and the career box, and one line of the report:
- `gap: 8px`, `align-items: center`, `flex-wrap: wrap`, `column-span: all`, `margin-right: auto`, title `var(--fs-md)` at weight 600 (item 1). Found with `grep -n 'gap: 8px' O52.md` (14, 27, 38), `grep -n 'column-span: all' O52.md` (14, 27) and `grep -n 'margin-right: auto' O52.md` (14, 27). Holds against `spec.md`: ASCII, the font size a token, no colour. `flex-wrap: wrap` breaks no rule, but it is the cause of F2.
- `padding: 4px 8px` for `.career` (item 4): `grep -n 'padding: 4px 8px' O52.md` (13, 14, 15, 30, 38). Holds, and leads to F4.
- "Everything in the brief is done": `grep -n 'Everything in the brief is done' O52.md` (113). Holds (`spec.md`, "Report").
- `LC_ALL=C grep -n '[^ -~]' O52.md` printed nothing (exit 1).

Findings: none.

## Declined to judge

- The plan's goal: `plan.md` has no Goal heading. Its first paragraph is "Execution ledger for `tools/oculus/DESIGN.md`", and `DESIGN.md` is gone (`ls DESIGN.md`: No such file). I used the goal the prompt gives for check 5.
- Pixel positions: none measured. I did not start the app, by brief. The x and height arithmetic in sections 5 and 6 is a reading of the CSS (`--tab-action: calc(22px * ...)` at `tokens.css:191`), not a measurement.
- Whether the whole tree is formatted, so that Verify 2's `npm run format` (`prettier --write .`, `package.json:21`) writes no file outside the paths: not verified.

Agent usage: a95389eccf26b9f17, claude-opus-5-5, 172686 tokens, 43 tool uses, 5 min 59 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

Each finding inside the step's line is closed by a change to `agents/briefs/O52.md`; the one part that widens the step is open item 225 (ruling Brief check scope).

1. F1, C1's grep can never print nothing: C1 now greps `<FoldHead` in the three files, `<details class="career"\|<summary>` in `CareerPanel.svelte` alone and `class="head"` in `CommandCenterView.svelte` and `Tasks.svelte`; the Snoozed group's `<details class="grp">` (lines 262-263) is named in the premises as unchanged.
2. F2, a long career line wraps instead of being cut: item 1 now has the fold control, the glyph and the title in one group that does not wrap and shrinks, the title's words in an element of their own cut with an ellipsis, and the end-of-row snippet after the group, wrapping to a second line in a narrow pane; C4's proof is the look in a pane narrower than the career line.
3. F3, folding unmounts the career editor: the premise says a closed `<details>` keeps its children mounted; item 4 keeps the body mounted and hidden while folded; C9 added; `EntryEditor.svelte` lines 55-70 added to "Read".
4. F4, the body's inset: item 4 says the body's padding changes so its content keeps today's inset with the box's new padding; the premise gives today's 11 px.
5. F5, the command center's pill in a narrow pane: item 1 and C5 say the pill wraps to a second line as now.
6. F6, an empty career line leaves the fold control named "Unfold ": the input is inside the step's line, its fix needs a heading word, a new key in `config/text/views/boards/focus.yml` outside the step's paths, so it widens the step: open item 225. The brief is unchanged for it.
7. F7, the tooltip and the title click: Decision 4 states both.
8. F8, C3 and C4 checked by reading alone: each names the look on landing as its proof (`spec.md`, What every package obeys); C3 no longer asks to check `ToolButton.svelte`, which "Read" names as read only.
9. F9, the users premise's command: the premise gives the two commands that print the three users, and names the two comment hits as true.
10. F10, minor details: the heading markup is lines 136-159; `cursor: pointer` is in the quoted rule; the `HELP.md:282` quote is named as the end of its bullet.
11. Items with no source: C1 to C9, "What it must do" and Verify 1 to 7 each name their source.
12. Dictated text: no line added after the check dictates words for a file; the CSS declarations added to item 1 (`min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis`) hold, ASCII, no colour, no size.
